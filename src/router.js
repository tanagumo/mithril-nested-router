const objectEntries = Object.entries ||
                      (obj => Object.keys(obj).reduce((acc, key) => [[key, obj[key]], ...acc], []));

const merge = (obj1, obj2) => {
  obj1 = Object.keys(obj1).reduce((acc, key) => ({...acc, [key]: obj1[key]}), {});
  return Object.keys(obj2).reduce((acc, key) => ({...acc, [key]: obj2[key]}), obj1);
};

const objectAssign = Object.assign ||
                     ((...objs) => objs.reduce((acc, obj) => merge(acc, obj), {}));

const _regExp = new RegExp(String.raw`:([^/.]+\.\.\.|[^/.]+)`, 'g');

const makeAttrs = ({key, ...rest} = {}) =>
  objectAssign(rest, key ? {key: typeof key === 'function' ? key() : key} : {});

let _reverses = {};

class Router {
  constructor(m) {
    this.m = m;
  }

  defineRoutes(root, defaultRoute, routes) {
    const {m} = this;
    const go = (routes, depth) => routes.reduce((acc, route) => {
      const {path, name, component, attrs, context, routes, onmatch} = route;
      const obj = routes
        ? objectEntries(go(routes, depth + 1)).reduce((acc, [n, [p, f]]) => {
            const k = `${name}:${n}`;
            const v = [`${path}${p}`,
                        depth == 0
                          ? objectAssign({
                              render(vnode) {
                                return m(onmatch ? vnode.tag : component, makeAttrs(attrs), f(context));
                              }
                            }, onmatch ? {onmatch} : {})
                          : (ctx = {}) => m(component, {...ctx, ...makeAttrs(attrs)}, f({...ctx, ...context}))];
            return {...acc, [k]: v};
          }, {})
        : {[name]: [path,
                    depth == 0
                      ? objectAssign({
                          render(vnode) {
                            return m(onmatch ? vnode.tag : component, makeAttrs(attrs));
                          }
                        }, onmatch ? {onmatch} : {})
                      : (ctx = {}) => m(component, {...ctx, ...makeAttrs(attrs)})]};
      return {...acc, ...obj};
    }, {});

    [_reverses, routes] = Object.entries(go(routes, 0)).reduce(([l, r], [n, [p, o]]) => {
      l[n] = p;
      r[p] = o;
      return [l, r];
    }, [{}, {}]);

    m.route(root, defaultRoute, routes);
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
