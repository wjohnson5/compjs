# compjs
complx in the browser

See the page here: http://wjohnson5.github.io/compjs/

WARNING: STILL IN PROGRESS

Where comp.js comes from:

1. Follow this guide to get emcc running: http://kripken.github.io/emscripten-site/docs/getting_started/index.html

2. Checkout complx - https://github.com/TricksterGuy/complx

3. Apply patch complx_patch.txt

4. Run:
  
  make liblc3.so CC='emcc --bind'
  
  emcc --bind liblc3/liblc3.so -O2 -o comp.js -s ALLOW_MEMORY_GROWTH=1

5. comp.js and comp.js.mem should be output
