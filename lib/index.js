/**
 * Created by massimo on 2014/4/12.
 * express-mvc framework
 */

var fs = require('fs');
var express = require('express');
var path = require('path');

/**
 * 配置路由
 * @param app
 */
module.exports = function (options, parent) {
    var PROJECT_DIR = path.join(__dirname, '../../');

    var controllerPath;
    var viewPath;
    var filter;
    if (parent === undefined) {
        parent = options;
        controllerPath = 'controllers';
        viewPath = 'views';
        var filterPath = path.join(PROJECT_DIR, 'filter.js');
        if (fs.existsSync(filterPath)) {
            filter = require(filterPath);
        }
        else {
            filter = {};
        }
    }
    else {
        controllerPath = options.controllerPath;
        viewPath = options.viewPath;
        filter = options.filter || {};
    }

    fs.readdirSync(path.join(PROJECT_DIR, controllerPath)).forEach(function (name) {
        var controllerName = name.replace('.js', ''); //去掉后缀名
        var controller = require(path.join(PROJECT_DIR, controllerPath, controllerName));

        var app = express();
        if (viewPath) {
            app.set('views', path.join(PROJECT_DIR, viewPath, controllerName));
        }

        var $mvcConfig = controller.$mvcConfig;

        for (var key in controller) {
            if (key[0] === '$') continue; //内部使用的方法以$开头

            var methodInfo = getMethodInfo(key);

            if ($mvcConfig && $mvcConfig.route && $mvcConfig.route[methodInfo.action]) {
                var individualConfig = $mvcConfig.route[methodInfo.action];
                var httpVerbs = individualConfig.httpVerbs || methodInfo.httpVerbs; //配置在mvcConfig中的有更高的优先级，且只取一个，不取并集或交集
                var middleware = individualConfig.middleware || methodInfo.middleware; //配置在mvcConfig中的中间件有更高的优先级，只取一个位置的

                methodInfo = {
                    action: methodInfo.action,
                    httpVerbs: httpVerbs,
                    middleware: middleware,
                    path: individualConfig.path
                };
            }

            if (!methodInfo.path) {
                methodInfo.path = methodInfo.path || ('/' + controllerName + '/' + methodInfo.action);
            }

            if (methodInfo.middleware) {
                for (var i = 0; i < methodInfo.middleware.length; i++) {
                    var itemMiddleware = methodInfo.middleware[i];
                    var func = controller[itemMiddleware] || filter[itemMiddleware];
                    if (func && typeof func === 'function') {
                        if (controllerName === 'home') {
                            configRoute(app, 'all', '/', func);
                        }
                        if (methodInfo.action === 'index') {
                            configRoute(app, 'all', '/' + controllerName, func);
                        }
                        configRoute(app, 'all', methodInfo.path, func);
                    }
                    else {
                        console.log('can not find filter', itemMiddleware);
                    }
                }
            }

            for (var j = 0; j < methodInfo.httpVerbs.length; j++) {
                var itemMethod = methodInfo.httpVerbs[j];
                if (controllerName === 'home') {
                    configRoute(app, itemMethod, '/', controller[key]);
                }

                if (methodInfo.action === 'index') {
                    configRoute(app, itemMethod, '/' + controllerName, controller[key]);
                }

                configRoute(app, itemMethod, methodInfo.path, controller[key]);
            }
        }
        parent.use(app);
    });
};

/**
 * 配置路由
 * @param app
 * @param method
 * @param path
 * @param func
 */
function configRoute(app, method, path, func) {
    try {
        app[method](path, func);
    }
    catch (e) {
        console.dir(e);
    }
}

/**
 * 获取方法支持的HTTP方法和中间件信息
 */
function getMethodInfo(methodName) {
    var arr = methodName.split('_');
    var httpVerbs = [];
    var middleware = [];
    arr.slice(1).forEach(function (item) {
        if (item[0] === '$') {
            middleware.push(item);
        }
        else {
            httpVerbs.push(item.toLowerCase()); //http方法转换为小写
        }
    });

    if (httpVerbs.length <= 0) {
        httpVerbs.push('get');
    }
    return {
        "action": arr[0],
        "httpVerbs": httpVerbs,
        'middleware': middleware
    };
}