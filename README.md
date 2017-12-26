# orient-mesh-global
[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

Globally orient a mesh using raytracing heuristics derived from [this paper](http://jcgt.org/published/0003/04/02/paper-lowres.pdf)

## Usage

[![NPM](https://nodei.co/npm/orient-mesh-global.png)](https://www.npmjs.com/package/orient-mesh-global)

```javascript
var bunny          = require('bunny')
var orient         = require('orient-mesh-global')
var flippedCount   = orient(bunny.cells, bunny.positions);
```

`require("orient-mesh-global")(cells, positions)`
----------------------------------------------------
Modifies `cells` in-place. Splits the complex into components defined by manifold connectivity (i.e. two cells are neighbors iff they share a manifold edge), and for each component attempts to orient cells using heuristics that are designed for meshes that imply solid domains.

In the case of non-orientability (determined by reaching a contradiction while propagating orientation), raises an error.

The method we use for finding manifold patches is derived from [this reference](http://www.alecjacobson.com/weblog/?p=3618).

## Contributing

See [stackgl/contributing](https://github.com/stackgl/contributing) for details.

## License

MIT. See [LICENSE.md](http://github.com/ataber/orient-mesh-global/blob/master/LICENSE.md) for details.
