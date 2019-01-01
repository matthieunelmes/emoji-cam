//Cross broswer setup
window.URL = window.URL || window.webkitURL;

//Dom selector
function $(s) { return document.querySelector(s); }

//Setup screens
var pre = $('#ascii');
var video = $('video');
var canvas = $('canvas');
var fps = $('#fps');

//Defaults
var GAMMA = 0.45;
var HREVERSE = true;
var MESSAGE;

//Start intro scene
function msg(id) { MESSAGE = $('#title').innerHTML + $('#' + id).innerHTML; }


function go() {
  msg('intro');
  if (navigator.getUserMedia) {
    var constraints = { video: true, audio: true };
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream){
      video.srcObject = stream;
      MESSAGE = null;
    })
    .catch(function(error){
      console.log(error);
    });
  } else {
    msg('nosupport');
  }
}

go();
requestAnimationFrame(tick);

var W = canvas.width;
var H = canvas.height;
console.log(W);
console.log(H);
var start = +new Date();

function tick() {
  requestAnimationFrame(tick);

  var ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  if (MESSAGE || !video.videoWidth)
    pre.innerHTML = noise(ctx);
  else if (!video.paused)
    pre.innerHTML = greyscale(ctx);

  var end = +new Date();
  var elapsed = end - start;
  start = end;

  var f = Array(2).join('0') + Math.round(1000/elapsed) + ' FPS';
  f = f.substr(f.length - 6);
  var g = 'BRIGHTNESS [+/-] ' + GAMMA.toFixed(2) + ' ' + Array(57).join('.') + ' ' + f;
  if (video.videoWidth) {
    var controls = video.paused ? '[p]ause' : '[P]AUSE';
    controls += ' .. ' + (HREVERSE ? '[h]oriz' : '[H]ORIZ');
    g = embedstr(g, controls, ' ');
  }
  fps.innerHTML = g;
}

function Wave(factor) {
  var angle = Math.random() * Math.PI;
  var cos = Math.cos(angle);
  var sin = Math.sin(angle);
  var amp = 1 + Math.random() * 10;
  var rate = (50 + 500 * Math.random()) * amp/5;
  var TAU = 2 * Math.PI;
  return function (v, x, y) {
    var tx = cos * x/amp - sin * 2*y/amp;
    return ((1-factor) * v +
            factor * (0.5 + 0.5 * Math.sin(tx + (new Date() / rate) % TAU)));
  };
}
 
var wave, ot = 0;

//Generate random noise
function noise() {
  var ascii = "";
  var msg = (MESSAGE||"").split('\n');
  var msgline = (H - msg.length) >> 1;
  var C = 7000;
  var P = 0.85;
  var topline = 0;
  var skzzt = 0;
  var t = (((+new Date() % C) / C) - P) / (1-P);
  if (!wave || (t > 0 != ot > 0))
    wave = new Wave(0.35);
  if (t > 0) {
    topline = (H - t * H) >> 0;
    skzzt = 3;
  } else {
    topline = 0;
    skzzt = 1;
  }
  ot = t;
  var palette = " `.',";
  for (var y = 0; y < H; ++y) {
    var lineno = (H + 1 + y - topline) % (H + 1);
    var line = "";
    if (lineno < H) {
      for (var x = 0; x < W; ++x) {
        var v = wave(Math.random(), x, y);
        v = 1 - Math.pow(v, GAMMA);
        line += palette[(v * palette.length) >> 0];  
      }
      line = embedstr(line, msg[lineno - msgline], ' ', skzzt);
    } else {
      line = "";
    }
    ascii += line + '\n';
  }
  return ascii;
}

function embedstr(line, mid, margin, skzzt) {
  if (!mid || !mid.length) return line;
  mid = margin + mid + margin;
  var s = (line.length - mid.length) >> 1;
  if (skzzt)
    s = s + (skzzt * (Math.random() * 1.1 - 0.05)) >> 0;
  return line.substr(0, s) + mid + line.substr(s + mid.length);
}

function greyscale(ctx) {
  var paletteArray = new Array ("☁️","☠️","🐼","⚽️","👽","📓","🌚","◼️");  
  var ascii = "";
  var pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (var y = 0; y < H; ++y) {
    for (var x = 0; x < W; ++x) {
      var rx = HREVERSE ? W-1-x : x;
      var p = 4 * (rx + pixels.width * y);
      var r = pixels.data[p++];
      var g = pixels.data[p++];
      var b = pixels.data[p++];
      var v = Math.max(r, g, b) / 255;
      v = 1 - Math.pow(v, GAMMA);
      v = (v * paletteArray.length) >> 0;
      v = Math.max(0, Math.min(paletteArray.length - 1, v));
      ascii += paletteArray[v];
    }
    if (y < H-1)
      ascii += '\n';
  }
  return ascii;
}

function rgb2hsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  var h = 0, s = 0, v = Math.max(r, g, b);
  var diff = v - Math.min(r, g, b);
  function diffc(c) {
    return (v - c) / 6 / diff + 1/2;
  }

  if (diff) {
    s = diff / v;
    if (r === v) {
      h = diffc(b) - diffc(g);
    } else if (g === v) {
      h = 1/3 + diffc(r) - diffc(b);
    } else if (b === v) {
      h = 2/3 + diffc(g) - diffc(r);
    }
    if (h < 0) {
      h += 1;
    } else if (h > 1) {
      h -= 1;
    }
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100)
  };
}

window.addEventListener('keydown', function (event) {
    var key = event.keyCode;
    var c = String.fromCharCode(key);
    if (key === 187 && GAMMA > 0.01) {
      GAMMA -= 0.05;
    } else if (key === 189) {
      GAMMA += 0.05;
    } else if (c === 'P') {
      if (video.paused) video.play(); else video.pause();
    } else if (c === 'H') {
      HREVERSE = !HREVERSE;
    }
  }, true);