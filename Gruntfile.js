module.exports = function(grunt) {

    grunt.initConfig({
        jsbeautifier: {
            files: [
                "src/**/*.js",
                "example/client.js",
                "example/index.js",
                "Gruntfile.js"
            ]
        },
        jshint: {
            options: {
                es3: true,
                unused: true,
                curly: false,
                eqeqeq: true,
                expr: true,
                eqnull: true
            },
            files: [
                "src/**/*.js",
                "example/client.js",
                "example/index.js",
                "Gruntfile.js"
            ]
        }
    });

    grunt.loadNpmTasks("grunt-jsbeautifier");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.registerTask("default", ["jsbeautifier", "jshint"]);
};
