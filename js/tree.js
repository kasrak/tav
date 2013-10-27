define(function(require, exports) {
    var _ = require('lodash');

    var TreeNode = function(value, left, right) {
        if (!(this instanceof TreeNode)) {
            throw new Error('Use "new" to create a TreeNode.');
        }

        this.value = value;
        this.left = null;
        this.right = null;
        this.parent = null;

        if (left) this.setLeft(left);
        if (right) this.setRight(right);
    };

    TreeNode.prototype.setLeft = function(node) {
        node.parent = this;
        this.left = node;
    };

    TreeNode.prototype.setRight = function(node) {
        node.parent = this;
        this.right = node;
    };

    /**
     * Given a list representing a binary tree, returns the root TreeNode
     * of the tree.
     *
     * Example: buildTree([5, [3, [1], [2]], [6]]) gives the following tree:
     *              5
     *          /       \
     *      3               6
     *   /     \
     *  1       2
     */
    var buildTree = function(list) {
        if (!list) return null;
        if (!_.isArray(list)) return new TreeNode(list);
        return new TreeNode(list[0],
                            buildTree(list[1]),
                            buildTree(list[2]));
    };

    exports.TreeNode = window.TreeNode = TreeNode;
    exports.buildTree = window.buildTree = buildTree;
});
