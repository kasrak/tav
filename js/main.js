require([
    './runner',
    './tree',
    './codemirror/codemirror',
    './codemirror/javascript',
    './zepto'
], function(runner) {
    // Startup
    $(function() {
        var editor = CodeMirror.fromTextArea($('#code-editor')[0], {
            lineNumbers: true,
            mode: 'javascript'
        });
        editor.focus();

        $('#run-button').click(function() {
            var code = editor.getValue();
            // TODO catch syntax errors
            runner.run(code);
        });
    });
});
