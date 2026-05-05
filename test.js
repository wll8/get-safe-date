const { getSafeDate } = require(`./index.js`)

new Promise(async () => {
  console.time(`safe`)
  const date = await getSafeDate({fast: true})
  console.log(`date`, date)
  console.timeEnd(`safe`)
})