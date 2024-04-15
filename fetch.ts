import fsp from 'fs/promises'

const API_URL = new URL('https://api.scryfall.com')

async function* getJson(setName: string): AsyncGenerator<object[]> {

  let url = new URL(API_URL)
  url.pathname = '/cards/search'
  url.searchParams.set('q', `e:${setName}`)
  url.searchParams.set('page', 1)
  url.searchParams.set('unique', 'cards')
  url.searchParams.set('order', 'set')
  url.searchParams.set('format', 'json')

  while (true) {

    response = await fetch(url)
    if (!response.ok) {
      console.error(response)
      console.error(await response.text())
      console.error(url)
      process.exit(1)
    }

    body = await response.json()

    yield body.data

    if (!body.has_more) {
      break
    }

    url = new URL(body.next_page)

  }

}

async function main() {

  const argv = process.argv.slice(2)
  const args = {
    set: argv[0].trim().toLowerCase()
  }

  const cards = []

  for await (const body of getJson(args.set)) {
    cards.push(...body)
  }

  console.log(cards.length)

  file = await fsp.open(`${args.set.toUpperCase()}.json`, 'w')
  await file.write(JSON.stringify(cards))
  await file.close()

  process.exit(0)

}

main()
