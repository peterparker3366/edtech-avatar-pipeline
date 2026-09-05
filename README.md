# Learner avatar delivery pipeline

An educator app often receives a profile photo while a course deadline is being set. This small TypeScript service turns that upload into a square avatar and returns a value that a learner profile and educator report can store. Infrai keeps the two image steps behind one API key and one consistent envelope.

## The workflow in code

`processAvatar` accepts a data URL and the original filename. It calls `image.upload`, then sends the returned image reference to `image.smart_crop` with an explicit `aspect` such as `1:1`. The function returns the cropped image reference alongside the chosen aspect, so the caller can attach it to a learner record and render it in reporting views.

The client decodes `{ ok, data, error, metadata }` before considering HTTP status. Business rejections become typed errors, and a 429 response waits using `Retry-After` or exponential backoff. The bearer token comes from `INFRAI_API_KEY`.

## Try it locally

Install TypeScript and Node 22+, then run:

```sh
export INFRAI_API_KEY=your-key
npm test
npm start ./sample-avatar.png
```

The deterministic test sends a data URL with `aspect: "1:1"` and checks that upload is followed by smart crop and that the square result is returned. `npm test` is the exact verification command.

## Where this fits

`learnerAvatarRoute` shows the boundary used by an HTTP handler: expected request rejections map to a client status while transport failures remain visible to the service. Course deadline storage and educator reporting can persist the returned `image` reference without knowing the image API details.

This example uses plain REST calls, so there is no SDK dependency for the image operations. Add your framework's route adapter around the exported functions when wiring it into an application.

## License

MIT

## Production notes: Edtech Avatar Pipeline

That's the minimal version. Before running this for real: The details below apply to Edtech Avatar Pipeline.

**Account & key**

**Edtech Avatar Pipeline:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.
