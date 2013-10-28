require([
    './runner',
    './drawtree',
    './tree',
    './knockout',
    './codemirror/codemirror',
    './codemirror/javascript',
    './zepto'
], function(runner, draw, tree, ko) {
    var editor;
    var view = {};
    var steps;

    view.didRun = ko.observable(false);

    view.curStep = ko.observable(-1);
    view.curStep.subscribe(function(oldStep) {
        if (oldStep == -1 || oldStep >= steps.length) return;
        var step = steps[oldStep - 1];
        var line = step.line - 1;
        editor.removeLineClass(line, 'background', 'current-step');
    }, null, 'beforeChange');
    view.curStep.subscribe(function(newStep) {
        var step = steps[newStep - 1];
        var line = step.line - 1;
        editor.addLineClass(line, 'background', 'current-step');

        // TODO show current variable values

        draw.clear();
        _.each(step.trees, function(root) {
            draw.drawTree(root);
        });

        _.each(step.scope, function(value, key) {
            if (value instanceof tree.TreeNodePointer) {
                draw.addLabelToNode(key, value.nodeId);
            }
        });
    });
    view.numSteps = ko.observable(0);

    view.run = function() {
        var code = editor.getValue();
        // TODO catch syntax errors
        runner.run(code, function(_steps) {
            if (_steps.length === 0) return;
            steps = _steps;
            view.didRun(true);
            view.curStep(1);
            view.numSteps(steps.length);
        });
    };

    view.stepNext = function() {
        var curStep = view.curStep();
        if (curStep < view.numSteps()) {
            view.curStep(++curStep);
        }
    };

    view.stepPrev = function() {
        var curStep = view.curStep();
        if (curStep > 1) {
            view.curStep(--curStep);
        }
    };

    ko.applyBindings(view);

    // Tracer

    // Startup
    $(function() {
        draw.attachToElement($('#tree-container')[0]);

        editor = CodeMirror.fromTextArea($('#code-editor')[0], {
            lineNumbers: true,
            mode: 'javascript'
        });
        editor.focus();

    });
});
