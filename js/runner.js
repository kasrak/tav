define(function(require, exports) {
    var _ = require('lodash');
    var acorn = require('acorn');
    require('escodegen.browser');
    var escodegen = window.escodegen;
    var escope = require('escope');
    var estraverse = require('estraverse');
    var set = require('set');

    // TODO might want to make these global after parsing the input code
    // to make sure we don't collide with an identifier in the input.
    window.__tav_steps = [];
    window.__tav_trace = function(line, scope) {
        window.__tav_steps.push({
            line: line,
            scope: scope
        });
    };

    var generateTraceNode = function(line, varlist) {
        var scope = _.map(varlist, function(identifier) {
            return '"' + identifier + '":' + identifier;
        });
        var code = ['__tav_trace(', line, ', {', scope.join(','), '});'].join('');
        var expr = acorn.parse(code).body[0];
        delete expr.start;
        delete expr.end;
        return expr;
    };

    var scopeTypes = set([
        'Program',
        'FunctionDeclaration',
        'FunctionExpression'
    ]);

    var controlTypes = set([
        'ExpressionStatement',
        'ForStatement',
        'ReturnStatement',
        'VariableDeclaration',
        'WhileStatement'
    ]);
    // TODO special case: loops and conditionals (trace check)

    exports.run = function(code) {
        // TODO break up this function

        var ast = acorn.parse(code, { locations: true });
        var scope = escope.analyze(ast);

        var scopeNodes = [];
        estraverse.traverse(ast, {
            enter: function(node, parent) {
                var curScope;
                var nodeIdx;

                if (scopeTypes.contains(node.type)) {
                    scopeNodes.push(node);
                }

                if (controlTypes.contains(node.type)) {
                    // get names of variables in current scope
                    curScope = _.pluck(scope.acquire(_.last(scopeNodes)).variables, 'name');

                    // add trace call
                    nodeIdx = parent.body.indexOf(node); // xxx perf
                    parent.body.splice(nodeIdx,
                                       0,
                                       generateTraceNode(node.loc.start.line,
                                                         curScope));
                }
            },
            leave: function(node, parent) {
                if (scopeTypes.contains(node.type)) {
                    scopeNodes.pop();
                }
            }
        });

        var generatedCode = escodegen.generate(ast);

        window.__tav_steps = [];
        console.log(generatedCode);
        eval(generatedCode);
    };
});
