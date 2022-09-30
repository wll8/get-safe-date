Used for scenarios that require verification time.

They are parsed from local files instead of directly obtaining maliciously modified system time or network time.

how to work:
- Get the latest network time
- Analyze the latest time of multiple files
- Store last latest time
- Compare and return the latest time

E.g:

Your system time just now was 2022-09-30, now you turn off the network and set it to 2011-01-31, you can still get 2022-09-30 through this program.

``` js
const { getSafeDate } = require(`get-safe-date`)

new Promise(async () => {
  const date = await getSafeDate()
  console.log(`date`, date) // timestamp
})
```