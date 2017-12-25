var vec3 = require('gl-vec3');
var consistentOrientation = require('consistently-orient');
var pickPoint = require('pick-point-in-triangle');
var pickSpherePoint = require('pick-point-on-sphere');
var rayIntersectTriangle = require('ray-triangle-intersection');
var manifoldPatches = require('manifold-patches');

module.exports = function(cells, positions, numberOfRays=100) {
  var flippedCount = 0;
  consistentOrientation(cells);
  manifoldPatches(cells).map(function(patch, i) {
    var arbitraryCell = patch[0];
    var vertices = [
      positions[arbitraryCell[0]],
      positions[arbitraryCell[1]],
      positions[arbitraryCell[2]]
    ];

    var cFront = 0;
    var cBack = 0;
    var dFront = 0;
    var dBack = 0;
    var pFront = 0;
    var pBack = 0;

    var scratch = [0, 0, 0];
    var edgeA = vec3.subtract(scratch, vertices[1], vertices[0]);
    var edgeB = vec3.subtract(scratch, vertices[2], vertices[0]);
    var normal = vec3.cross(scratch, edgeA, edgeB);
    var facesFront = function(direction) {
      return vec3.dot(normal, direction) > 0;
    }

    var point = pickPoint(vertices);
    pickSpherePoint(numberOfRays).map(function(direction) {
      var facingForward = facesFront(direction);
      var minDistance = 0;
      var triangleIntersected = false;
      cells.map(function(cell) {
        var triangle = [
          positions[cell[0]],
          positions[cell[1]],
          positions[cell[2]]
        ];
        var distance = rayIntersectTriangle(scratch, point, direction, triangle);
        if (distance) {
          triangleIntersected = true;

          if (distance < minDistance) {
            minDistance = distance;
          }

          if (facingForward) {
            pFront++;
          } else {
            pBack++;
          }
        }
      });

      if (triangleIntersected) {
        if (facingForward) {
          cFront++;
          dFront += minDistance;
        } else {
          cBack++;
          dBack += minDistance;
        }
      }
    });

    pFront = pFront % 2;
    pBack = pBack % 2;

    // if ((pFront < pBack) || ((pFront == pBack) && (dFront < dBack))) {
    // if ((cFront < cBack) || ((cFront == cBack) && (dFront < dBack))) {
    if (cFront < cBack) {
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
