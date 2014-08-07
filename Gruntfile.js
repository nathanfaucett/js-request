module.exports = function(grunt) {

    grunt.initConfig({
        jsbeautifier: {
            files: [
                "**/*.js",
                "!node_modules/**/*"
            ]
        }
    });

    grunt.loadNpmTasks("grunt-jsbeautifier");
    grunt.registerTask("default", ["jsbeautifier"]);
};
