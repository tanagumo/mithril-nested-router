# mithril-nested-router

mithril router with nested routing, reverse and redirect functionality.

## Install

`npm install mithril-nested-router`

## How to use

#### Create router
You can create router using `Router.create`.
Only first `Router.create` call makes a singleton router instance.

Once you have created router instance, you can retrieve it later using `Router.getInstance()`.

```
const m = require('mithril');
const Router = require('mithril-nested-router');

const router1 = Router.create(m);
const router2 = Router.create(m);
const router3 = Router.getInstance();
// router1, router2 and router3 are reference to a same router instance.
```

#### Define routes
You can define nested routes using `Router.prototype.defineRoutes`.
Child components are injected into `vnode.children` of Parent component.

```
// Parent component
const Page = {
  view(vnode) {
    return m('div', [
      m('p', 'router example'),
      m('ul', ['c1', 'c2'].map(name =>
        m('li', m('a', {href: `/${name}`, oncreate: router.route.link}, name))
      )),
      vnode.children
    ]);
  }
};

// Child components
const C1 = {
  view(vnode) { return m('p', 'content1'); }
};

const C2 = {
  view(vnode) { return m('p', 'content2'); }
};

// Define routes
router.defineRoutes(document.getElementById('root'), '/c1', [
  {path: '/', name: 'root', component: Page, routes: [
    {path: 'c1', name: 'c1', component: C1},
    {path: 'c2', name: 'c2', component: C2},
  ]}
]);
```

You can pass attrs to a Component using `attrs` property.

```
router.defineRoutes(document.getElementById('root'), '/', [
  {path: '/', name: 'root', component: Component, attrs: {a: 1, b: 2}}
]);

const Component = {
  oninit(vnode) {
    console.log(vnode.attrs);    // {a: 1, b: 2}
  },
  ...
};
```

You can also use `context` property with `routes` property. Context propagates to sub routes.
The example below, C1, C2 and G1 share the same context defined within GrantParent. Context is injected into `vnode.attrs`.
An attrs or contexts defined within descendants override the same property of context defined within ancestors.

```
router.defineRoutes(document.getElementById('root'), '/c1', [
  {path: '/', name: 'root', component: GrandParent, context: {a: 1}, routes: [
    {path: 'c1', name: 'c1', component: C1},
    {path: 'c2/', name: 'c2', component: C2, routes: [
      {path: 'g1', name: 'g1', component: G1}
    ]}
  ]}
]);
```
You can use `onmatch` instead of `component` on top level route definition. About `onmatch`, please refer to [mithril document about RouteResolver](http://mithril.js.org/route.html#routeresolver).

```
router.defineRoutes(document.getElementById('root'), '/', [
  {path: '/',
   name: 'root',
   onmatch() {
     // do some stuff
     return Component;
   }
  }
]);
```
If you define a parameterized route, going from the parameterized route to the same route with a different parameter (e.g. going from `/page/1` to `/page/2` given a route `/page/:id`) doesn't invoke component recreation. In other words, `oninit` and `oncreate` of the component don't get called. If you want to recreate a component, you can use `key`. If you set a function as `key` value, an invocation of the function is done after a route was resolved.

```
router.defineRoutes(document.getElementById('root'), '/page/1', [
  {path: '/page/:id', name: 'page', component: Page, attrs: {key: () => router.route.param('id')}},
]);
```

#### Get path for name
You can use `Router.prototype.reverse` to get path for name.

```
router.defineRoutes(document.getElementById('root'), '/c1', [
  {path: '/', name: 'root', component: GrandParent, routes: [
    {path: 'c1', name: 'c1', component: C1},
    {path: 'c2/', name: 'c2', component: C2, routes: [
      {path: 'g1', name: 'g1', component: G1}
    ]}
  ]}
]);

console.log(router.reverse('root:c2:g1'));        // /c2/g1
```

You can pass routing parameters to `Router.prototype.reverse` if you defined routes using routing parameters.

```
router.defineRoutes(document.getElementById('root'), '/x', [
  {path: '/', name: 'root', component: Layout, routes: [
    {path: ':content', name: 'content', component: Content},
  ]}
]);

console.log(router.reverse('root:content', {content: 'c1'}));        // /c1
console.log(router.reverse('root:content', {content: 'c2'}));        // /c2
```

#### Redirect
You can use `Router.prototype.redirect` to change route.

```
router.defineRoutes(document.getElementById('root'), '/c2/1', [
  {path: '/', name: 'root', component: Layout, routes: [
    {path: 'c1', name: 'c1', component: C1},
    {path: 'c2/', name: 'c2', component: C2, routes: [
      {path: ':d', name: 'd', component: D}
    ]}
  ]}
]);

// Change current route to /c1
router.redirect('root:c1');

// Of course, you can pass routing parameters to redirect method.
router.redirect('root:c2:d', {d: 3});
```

Technically, `Router.prototype.redirect` gets path for name, and just delegate to `m.route.set`.
So, `Router.prototype.redirect` has same functionality as `m.route.set`. Please refer to [mithril documentation about m.route.set](http://mithril.js.org/route.html#mrouteset)

#### Get `m.route`
`Router.prototype.route` getter return `m.route`. So you can use `Router.prototype.route` instead of `m.route`;

## License

MIT
