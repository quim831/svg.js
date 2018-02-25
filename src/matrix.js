SVG.Matrix = SVG.invent({
  // Initialize
  create: function(source) {
    var i, base = arrayToMatrix([1, 0, 0, 1, 0, 0])

    // ensure source as object
    source = source instanceof SVG.Element ?
      source.matrixify() :
    typeof source === 'string' ?
      arrayToMatrix(source.split(SVG.regex.delimiter).map(parseFloat)) :
    arguments.length == 6 ?
      arrayToMatrix([].slice.call(arguments)) :
    Array.isArray(source) ?
      arrayToMatrix(source) :
    typeof source === 'object' ?
      source : base

    // merge source
    for (i = abcdef.length - 1; i >= 0; --i)
      this[abcdef[i]] = source[abcdef[i]] != null ?
        source[abcdef[i]] : base[abcdef[i]]
  }

  // Add methods
, extend: {
    // Convert an array of affine parameters into a matrix
    compose: function (o, cx, cy) {

      // Set the defaults
      var tx = o.translateX || 0
        , ty = o.translateY || 0
        , theta = o.theta || 0
        , sx = o.scaleX || 1
        , sy = o.scaleY || 1
        , lam = o.shear || 0
        , cx = cx || 0
        , cy = cy || 0

      // Calculate the trigonometric values
      var ct = Math.cos(theta * Math.PI / 180)
        , st Math.sin(theta * Math.PI / 180)

      // Calculate the matrix components directly
      var a = sx * ct
        , b = sx * st
        , c = lam * sx * ct - sy * st
        , d = lam * sx * st + sy * ct
        , e = - sx * ct * (cx + cy * lam) + sy * st * cy + tx + cx
        , f = - sx * st * (cx + cy * lam) - sy * ct * cy + ty + cy

      // Construct a new matrix and return it
      var matrix = new SVG.Matrix([a, b, c, d, e, f])
      return matrix
    }
    // Decompose a matrix into the affine parameters needed to form it
  ,  decompose: function (matrix, cx, cy) {

      // Get the paramaters of the current matrix
      var a = matrix.a
        , b = matrix.b
        , c = matrix.c
        , d = matrix.d
        , e = matrix.e
        , f = matrix.f

      // Project the first basis vector onto the unit circle
      var circle = unitCircle (a, b)
        , theta = circle.theta
        , ct = circle.cos
        , st = circle.sin

      // Work out the transformation parameters
      var signX = Math.sign(a * ct + b * st)
        , sx = signX * mag (a, b)
        , lam = (st * d + ct * c) / (ct * a + st * b)
        , signY = Math.sign(- c * st + d * ct)
        , sy = mag (lam * a - c, d - lam * b)
        , tx = e - cx + cx * ct * sx + cy * (lam * ct * sx - st * sy)
        , ty = f - cy + cx * st * sx + cy * (lam * st * sx + ct * sy)

      // Package and return the parameters
      return {

        // Bundle the affine parameters
        translateX: tx
      , translateY: ty
      , theta: theta
      , scaleX: sx
      , scaleY: sy
      , shear: lam

      // Bundle the matrix parameters
      , a: this.a
      , b: this.b
      , c: this.c
      , d: this.d
      , e: this.e
      , f: this.f

      // Return the new origin point
      , x: this.e
      , y: this.f

      // Store the matrix
      , matrix: new SVG.Matrix(this)
      }
    }
    // Clone matrix
  , clone: function() {
      return new SVG.Matrix(this)
    }
    // Morph one matrix into another
  , morph: function(matrix) {
      // store new destination
      this.destination = new SVG.Matrix(matrix)

      return this
    }
    // Get morphed matrix at a given position
  , at: function(pos) {
      // make sure a destination is defined
      if (!this.destination) return this

      // calculate morphed matrix at a given position
      var matrix = new SVG.Matrix({
        a: this.a + (this.destination.a - this.a) * pos
      , b: this.b + (this.destination.b - this.b) * pos
      , c: this.c + (this.destination.c - this.c) * pos
      , d: this.d + (this.destination.d - this.d) * pos
      , e: this.e + (this.destination.e - this.e) * pos
      , f: this.f + (this.destination.f - this.f) * pos
      })

      return matrix
    }
    // Multiplies by given matrix
  , multiply: function(matrix) {
      return new SVG.Matrix(this.native().multiply(parseMatrix(matrix).native()))
    }
    // Inverses matrix
  , inverse: function() {
      return new SVG.Matrix(this.native().inverse())
    }
    // Translate matrix
  , translate: function(x, y) {
      return new SVG.Matrix(this.native().translate(x || 0, y || 0))
    }
    // Scale matrix
  , scale: function(x, y, cx, cy) {
      // support uniformal scale
      if (arguments.length == 1) {
        y = x
      } else if (arguments.length == 3) {
        cy = cx
        cx = y
        y = x
      }

      return this.around(cx, cy, new SVG.Matrix(x, 0, 0, y, 0, 0))
    }
    // Rotate matrix
  , rotate: function(r, cx, cy) {
      // convert degrees to radians
      r = SVG.utils.radians(r)

      return this.around(cx, cy, new SVG.Matrix(Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0))
    }
    // Flip matrix on x or y, at a given offset
  , flip: function(a, o) {
      return a == 'x' ?
          this.scale(-1, 1, o, 0) :
        a == 'y' ?
          this.scale(1, -1, 0, o) :
          this.scale(-1, -1, a, o != null ? o : a)
    }
    // Skew
  , skew: function(x, y, cx, cy) {
      // support uniformal skew
      if (arguments.length == 1) {
        y = x
      } else if (arguments.length == 3) {
        cy = cx
        cx = y
        y = x
      }

      // convert degrees to radians
      x = SVG.utils.radians(x)
      y = SVG.utils.radians(y)

      return this.around(cx, cy, new SVG.Matrix(1, Math.tan(y), Math.tan(x), 1, 0, 0))
    }
    // SkewX
  , skewX: function(x, cx, cy) {
      return this.skew(x, 0, cx, cy)
    }
    // SkewY
  , skewY: function(y, cx, cy) {
      return this.skew(0, y, cx, cy)
    }
    // Transform around a center point
  , around: function(cx, cy, matrix) {
      return this
        .multiply(new SVG.Matrix(1, 0, 0, 1, cx || 0, cy || 0))
        .multiply(matrix)
        .multiply(new SVG.Matrix(1, 0, 0, 1, -cx || 0, -cy || 0))
    }
    // Convert to native SVGMatrix
  , native: function() {
      // create new matrix
      var matrix = SVG.parser.nodes.svg.node.createSVGMatrix()

      // update with current values
      for (var i = abcdef.length - 1; i >= 0; i--)
        matrix[abcdef[i]] = this[abcdef[i]]

      return matrix
    }
    // Convert matrix to string
  , toString: function() {
      return 'matrix(' + this.a + ',' + this.b + ',' + this.c + ',' + this.d + ',' + this.e + ',' + this.f + ')'
    }
  }

  // Define parent
, parent: SVG.Element

  // Add parent method
, construct: {
    // Get current matrix
    ctm: function() {
      return new SVG.Matrix(this.node.getCTM())
    },
    // Get current screen matrix
    screenCTM: function() {
      /* https://bugzilla.mozilla.org/show_bug.cgi?id=1344537
         This is needed because FF does not return the transformation matrix
         for the inner coordinate system when getScreenCTM() is called on nested svgs.
         However all other Browsers do that */
      if(this instanceof SVG.Nested) {
        var rect = this.rect(1,1)
        var m = rect.node.getScreenCTM()
        rect.remove()
        return new SVG.Matrix(m)
      }
      return new SVG.Matrix(this.node.getScreenCTM())
    }

  }

})
