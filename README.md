# moon.js

a view-driven node.js framework that generates the client side

Nowadays, there is a strong tendency to build two separate applications that interconnect via an API. While this structure is most definitely the best when it comes to providing users with the best experience, the work required for actually building such system is nearly doubled as the client-side code is usually a lot different from the server-side code.

moon.js aims to have developers **write only one codebase which would work on both the server and the client.** This was unthinkable for a long time (except for maybe GWT) but with node.js being the new hotness, this goal has become to be reachable.

The server and client environments are very different. For one thing, the server-side application is supposed to respond to multiple users at once whereas the client-side application is single user. There thus have to be **a high-level of abstraction** to allow for having the same application code run in both of these environments.

moon.js is distinct from other frameworks in that that it reverses the application object model a bit. It is **view-driven** which means that views are the components that declare how is the application built. moon.js brings some concepts from the server to the client and vice versa.


# Concepts

## Declarative Templates

Similar to AngularJS or other MVVM-like frameworks, the templates provide a declarative way of specifying the application structure.

```html
<!DOCTYPE html>
<html m:control="ApplicationController">
<meta charset="UTF-8">
<title>{site.name}</title>

<body>
<h1>{site.name}</h1>
<div class="content">
  {@view $view}
</div>
```

As you can see in the code above, the template declares that the whole `<html>` element should be controlled by an instance of `AppplicationController`. The controller is then responsible for setting up the root app-specific scope (or a view-model if you will).

This architecture has only been used on the client so far. moon.js brings it to the server as well.

## CommonJS Modules

The CommonJS module system (which is implemented by node.js) has been proven to be a good choice. moon.js brings them to the client which allows for a seamless development of the application component.

## Dependency Injection

Components of the applications can request that instances of other components are passed to their constructors (constructor injection).

The dependent component (the one requesting other instances) has to list its dependencies in its `$deps` property. As this list has to be known to the *injector* (the IoC container providing the dependent component with other instances) before the dependent component is instantiated, this list has to be specified on its `prototype`.

This list then contains names of the services (other components) that are desired to be provided by the IoC container.

```js
MyController.prototype.$deps = [ '$router' ];
```

Currently, the only service available in the system out-of-the-box is `$app` which is the `Application` instance created by `moon.create`.

Custom services can be added to the IoC container. You can either provide one instance that should get injected into other components directly or you can provide a factory (function) that returns an instance. In case of a factory, an instance is created when the first requested and it is then cached for future requests.

```js
app.ioc.addService('name', my_service);

app.ioc.addService('name', function () {
  return new MyService();
});
```


# Getting started

## Bootstrapping

```js
// main.js

var moon = require('moon');
var path = require('path');

var app = moon.create(path.resolve('./app'));

app.router.routes = {
  $layout: app.view('layout'),
  '/': app.view('index'),
  '/members': app.view('member/index'),
  '/posts': app.view('post/index')
};

app.server.port = moon.env['PORT'] || 5000;

app.run();
```

The routes point directly to views as they are the components which declare how to build the application object model.

There is a special `$layout` key in the `routes` map that (if present) makes the framework render the specified view insted with a special `$view` variable (which contains the actual view for the route) available in the root scope (see below).

## Views

View/template files are located at the `APP_DIR/views` directory by default and have the extension `.view`. They can be simply `require`-ed once the `moon` module is loaded. The preferred usage is however via the `app.view` method.

Views are bound to lexical scopes that create a tree hierarchy. The hierarchy is formed using so called *widgets* (see below). The framework provides a *root scope* which includes important variables such as the location of generated client-side JavaScript code or the Application Cache manifest for offline capabilites.

The embedded language used in the templates is very close to normal JavaScript. Scripts are wrapped in curly brackets (`{` and `}`) and their return value is printed in their place when they are evaluated.

- variables – `My name is {name}.`
- maps – `My friend's name is {friend.name}.`
- helper function calls – `It costs {@format_price item.price}.`

Scripts can be used in both element content and attribute values.

```html
<div class="message-{message.type}">{message.text}</div>
```

## Widgets

Aside from one-way bindings, the view can have widgets bound to them. Such bindings are specified in form of element attributes.

### Controllers

```html
<div m:control="MyController">
  <p>My name is {name}.
</div>
```

The only widgets that are currently available out-of-the-box in the framework are *controller widgets.* They create their own child scopes (which inherit from their respective parent scopes).

Controller constructors are invoked with the `new` keyword and are passed no arguments.

```js
// app/controllers/my-controller.js

var MyController = function () {
  this.$scope.name = 'Jan Kuča';
};

module.exports = MyController;
```

Widgets can implement an `update` method. This method (if present) is called every time it is expected that the scope has changes.

## Conclusion

This is a highly experimental project. Let's hope it gets to an awesome stage.
