require([
    './runner',
    './knockout',
    './tree',
    './codemirror/codemirror',
    './codemirror/javascript',
    './zepto'
], function(runner, ko) {
    var editor;
    var view = {};
    var steps;

    view.didRun = ko.observable(false);

    view.curStep = ko.observable(-1);
    view.curStep.subscribe(function(oldStep) {
        if (oldStep == -1) return;
        var step = steps[oldStep - 1];
        var line = step.line - 1;
        editor.removeLineClass(line, 'background', 'current-step');
    }, null, 'beforeChange');
    view.curStep.subscribe(function(newStep) {
        var step = steps[newStep - 1];
        var line = step.line - 1;
        editor.addLineClass(line, 'background', 'current-step');
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
        // elements
        editor = CodeMirror.fromTextArea($('#code-editor')[0], {
            lineNumbers: true,
            mode: 'javascript'
        });
        editor.focus();
    });
});
