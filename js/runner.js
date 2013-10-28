define(function(require, exports) {
    /*jshint evil:true */
    var _ = require('lodash');
    var acorn = require('acorn');
    var drawtree = require('drawtree');
    require('escodegen.browser'); // escodegen adds itself to global scope
    var escodegen = window.escodegen;
    var escope = require('escope');
    var estraverse = require('estraverse');
    var set = require('set');
    var tree = require('tree');

    // TODO might want to make this global after parsing the input code
    // to make sure we don't collide with an identifier in the input.
    var currentRunSteps = [];
    window.__tav_trace = function(line, scope) {
        var treeNodes = {}; // maps variable name to node id
        var treeRoots = {}; // maps root id to the root node

        _.each(scope, function(value, key) {
            if (value instanceof tree.TreeNode) {
                treeNodes[key] = value.__id();
                scope[key] = new tree.TreeNodePointer(value.__id());

                // find the root of the node
                var root = value;
                while (root.parent) root = root.parent;
                treeRoots[root.__id()] = root;
            }
        });

        var trees = [];
        _.each(treeRoots, function(root) {
            // freeze each tree
            trees.push(new tree.FrozenTree(root));
        });

        currentRunSteps.push({
            line: line,
            scope: scope,
            trees: trees
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

    exports.run = function(code, onfinish) {
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

                if (controlTypes.contains(node.type) && _.isArray(parent.body)) {
                    // get names of variables in current scope
                    curScope = _.pluck(scope.acquire(_.last(scopeNodes)).variables, 'name');

                    // add trace call
                    nodeIdx = parent.body.indexOf(node); // xxx perf
                    parent.body.splice(nodeIdx, 0,
                        generateTraceNode(node.loc.start.line, curScope));
                }
            },
            leave: function(node, parent) {
                if (node.type == 'Program') {
                    node.body.push(generateTraceNode(node.loc.end.line + 1,
                        _.pluck(scope.acquire(node).variables, 'name')));
                }
                if (scopeTypes.contains(node.type)) {
                    scopeNodes.pop();
                }
            }
        });

        var generatedCode = escodegen.generate(ast);

        currentRunSteps = [];
        console.log(generatedCode);
        eval(generatedCode);
        if (onfinish) onfinish(currentRunSteps);
    };
});
