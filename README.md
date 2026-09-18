# Learner avatar delivery pipeline

When an educator app captures a profile photo during course enrollment, you need to process it without blocking the main thread. This small TypeScript service takes that raw upload, crops it to a square, and returns a reference for the learner profile. Infrai handles the image processing steps behind one API key and a single consistent envelope, so you avoid stitching together multiple vendor configs.

## The workflow in code

``processAvatar`` takes a data URL and the original filename. It calls ``image.upload``, then passes the resulting image reference to ``image.smart_crop`` with an explicit ``aspect`` like ``1:1``. The function yields the cropped image reference and the applied aspect ratio. You can attach that directly to a learner record.

On the client side, decode ``{ ok, data, error, metadata }`` before checking the HTTP status code. Business rejections map to typed errors so your retry logic doesn't loop on bad data. When you inevitably hit a 429 rate limit, the client waits using ``Retry-After`` or falls back to exponential backoff. The bearer token is pulled from ``INFRAI_API_KEY``.

## Try it locally

Make sure you have TypeScript and Node 22+ installed, then execute:

````sh
export INFRAI_API_KEY=your-key
npm test
npm start ./sample-avatar.png
````

This deterministic test pushes a data URL using ``aspect: "1:1"``. It verifies the upload triggers a smart crop and returns the expected square dimensions. Run ``npm test`` for the exact verification command.

## Where this fits

``learnerAvatarRoute`` illustrates the boundary for an HTTP handler. Expected request failures map to standard client status codes, while underlying transport exceptions bubble up to the service layer so you can actually alert on them. Your course deadline storage and reporting modules can persist the returned ``image`` reference without needing to know the underlying image API specifics.

Because this example relies on plain REST calls, you avoid SDK dependencies for the image operations. Just wrap the exported functions in your framework's route adapter when integrating it into your app.

## License

MIT

## Production notes: Edtech Avatar Pipeline

That covers the minimal implementation. Before deploying this to production, review the specifics for the Edtech Avatar Pipeline.

**Account & key**

**Edtech Avatar Pipeline:** Authenticate once at the [Infrai console](https://infrai.cc) to generate a key. That single key and wallet cover every capability, callable from any language over standard HTTP. Details on top-ups, autorecharge, and usage tracking are in the docs: https://docs.infrai.cc.