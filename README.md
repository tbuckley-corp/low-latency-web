# low-latency-web

This is a sample app showing how to get a low-latency inking surface on ChromeOS. It renders a `<canvas>` 
directly to the display using a combination of `{desynchronized: true}` and alignment, and also predicts
the movement of the stylus.

## Running

All you need is a static HTTP server to run this. For example, `cd` into the folder and run:

```python -m http.server```

Then visit `http://localhost:8000/`
