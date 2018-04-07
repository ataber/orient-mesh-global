var vec3 = require('gl-vec3');
var mass = require('mesh-mass');
var consistentOrientation = require('consistently-orient');
var pickPoint = require('pick-point-in-triangle');
var pickSpherePoint = require('pick-point-on-sphere');
var rayIntersectTriangle = require('ray-triangle-intersection');
var manifoldPatches = require('manifold-patches');

module.exports = function(cells, positions, totalRays = null, minimumRays = null) {
  var minimumRays = minimumRays || 10;
  var totalRays = totalRays || cells.length * 50;
  var totalArea = mass(cells, positions).area;

  var flippedCount = consistentOrientation(cells);
  manifoldPatches(cells).map(function(patch, i) {
    var arbitraryCell = patch[0];
    var vertices = [
      Array.from(positions[arbitraryCell[0]]),
      Array.from(positions[arbitraryCell[1]]),
      Array.from(positions[arbitraryCell[2]])
    ];
    var cellSet = new Set([arbitraryCell[0], arbitraryCell[1], arbitraryCell[2]]);

    var cFront = 0;
    var cBack = 0;
    var dFront = 0;
    var dBack = 0;

    var edgeA = [];
    var edgeB = [];
    var normal = [];
    vec3.subtract(edgeA, vertices[1], vertices[0]);
    vec3.subtract(edgeB, vertices[2], vertices[0]);
    vec3.cross(normal, edgeA, edgeB);
    var facesFront = function(direction) {
      return vec3.dot(normal, direction) > 0;
    }

    var area = vec3.length(normal);
    // https://github.com/libigl/libigl/blob/5fd9c428cf9e34931213658d66de87300b59c2a0/include/igl/embree/reorient_facets_raycast.cpp#L80
    var numberOfRays = parseInt(Math.max(minimumRays, totalRays * area / totalArea));

    for (var i = 0; i < numberOfRays; i++) {
      var point = pickPoint(vertices);
      // shoot rays in forwards and backwards directions
      var directions = [];
      pickSpherePoint(1).map(function(direction) {
        directions.push(direction);
        directions.push(vec3.scale([], direction, -1));
      });
      directions.map(function(direction) {
        var facingForward = facesFront(direction);
        var minDistance = null;
        var triangleIntersected = false;
        cells.map(function(cell) {
          if (cellSet.has(cell[0]) &&
              cellSet.has(cell[1]) &&
              cellSet.has(cell[2])) {
            // rule out self-intersections
            return;
          }

          var triangle = [
            positions[cell[0]],
            positions[cell[1]],
            positions[cell[2]]
          ];
          var distance = rayIntersectTriangle([], point, direction, triangle);
          if (distance && distance > 0) {
            triangleIntersected = true;

            if (minDistance) {
              if (distance < minDistance) {
                minDistance = distance;
              }
            } else {
              minDistance = distance;
            }
          }
        });

        if (triangleIntersected) {
          if (facingForward) {
            dFront += minDistance;
          } else {
            dBack += minDistance;
          }
        } else {
          if (facingForward) {
            cFront++;
          } else {
            cBack++;
          }
        }
      });
    }

    if ((cFront < cBack) || ((cFront == cBack) && (dFront < dBack))) {
      // flip orientation for each cell in the patch
      patch.map(function(cell) {
        var i1 = cell[0];
        cell[0] = cell[1];
        cell[1] = i1;
        flippedCount++;
      });
    }
  });

  return flippedCount;
}
