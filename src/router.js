const objectEntries = Object.entries ||
                      (obj => Object.keys(obj).reduce((acc, key) => [[key, obj[key]], ...acc], []));

const merge = (obj1, obj2) => {
  obj1 = Object.keys(obj1).reduce((acc, key) => ({...acc, [key]: obj1[key]}), {});
  return Object.keys(obj2).reduce((acc, key) => ({...acc, [key]: obj2[key]}), obj1);
};

const objectAssign = Object.assign ||
                     ((...objs) => objs.reduce((acc, obj) => merge(acc, obj), {}));

const _regExp = new RegExp(String.raw`:([^/.]+\.\.\.|[^/.]+)`, 'g');
let _reverses = null;

class Router {
  constructor(m) {
    this.m = m;
  }

  defineRoutes(root, defaultRoute, routes) {
    const {m} = this;
    const go = routes => routes.reduce((acc, route) => {
      const {path, name, component, attrs = {}, context, routes, recreateOnRouteChange = false} = route;
      let obj = null;
      if (!routes) {
        obj = {[path]: [name, (ctx = {}) => m(component, {...ctx, ...attrs})]};
      } else {
        obj = objectEntries(go(routes)).reduce((acc, [p, [n, f]]) => {
          const k = `${path}${p}`;
          const v = [`${name}:${n}`,
                     (ctx = {}) =>
                       m(component,
                         objectAssign({...ctx, ...attrs}, recreateOnRouteChange === true ? {key: new Date()} : {}),
                         f({...ctx, ...context}))
                    ];
          return {...acc, [k]: v};
        }, {});
      }
      return {...acc, ...obj};
    }, {});

    const _routes = {};
    const _paths = {};
    routes.forEach(route => {
      const {path, name, component, onmatch, attrs = {}, context, routes, recreateOnRouteChange = false} = route;
      if (!routes) {
        _routes[path] = objectAssign({
          render(vnode) {
            return m(onmatch ? vnode.tag : component, attrs)
          }
        }, onmatch ? {onmatch} : {});
        _paths[path] = name;
      } else {
        objectEntries(go(routes)).forEach(([p, [n, f]]) => {
          _routes[`${path}${p}`] = objectAssign({
            render(vnode) {
              return m(onmatch ? vnode.tag : component,
                       objectAssign(attrs, recreateOnRouteChange === true ? {key: new Date()} : {}),
                       f(context));
            }
          }, onmatch ? {onmatch} : {});
          _paths[`${path}${p}`] = `${name}:${n}`;
        });
      }
    });
    _reverses = objectEntries(_paths).reduce(
      (acc, [path, name]) => ({...acc, [name]: path}), {});
    this.m.route(root, defaultRoute, _routes);
  }

  redirect(name, data, options) {
    const path = _reverses[name];
    if (!path) {
      throw new Error(`Invalid name specified: ${name}`);
    }
    this.m.route.set(path, data, options);
  }

  reverse(name, data) {
    const path = _reverses[name];
    if (!path) {
      throw new Error(`Invalid name specified: ${name}`);
    }
    return path.replace(_regExp, (...args) => {
      const result = data[args[1]];
      if (!result) {
        throw new Error(`Does not exist a value for parameter ${args[0]}`);
      }
      return result;
    });
  }

  get route() {
    return this.m.route;
  }
}

let _router = null;

export default {
  create(m) {
    if (!_router) {
      _router = new Router(m);
      this.getInstance = () => {
        return _router;
      };
    }
    return _router;
  },
};
