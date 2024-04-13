const fs = require('fs')

const fsp = require('fs/promises')

async function main() {

  const argv = process.argv.slice(2)
  const args = {
    set: argv[0].trim().toLowerCase()
  }

  api_url = new URL('https://api.scryfall.com')

  url = new URL(api_url)
  url.pathname = '/cards/search'
  url.searchParams.set('q', `e:${args.set}`)
  url.searchParams.set('unique', 'cards')
  url.searchParams.set('order', 'set')
  url.searchParams.set('format', 'csv')

  file = await fsp.open(`${args.set.toUpperCase()}.csv`, 'w')

  for (page = 1; true; ++page) {

    url.searchParams.set('page', page)

    response = await fetch(url)
    if (!response.ok) {
      console.error(response)
      console.error(await response.text())
      console.error(url)
      process.exit(1)
    }
    table = await response.text()

    // Conditionally remove the header line.
    if (page > 1) {
      i = table.indexOf('\n')
      table = table.substring(i + 1)
    }

    await file.write(table)

    if (response.headers.get('x-scryfall-has-more') === 'false') {
      break
    }

  }

  await file.close()

  process.exit(0)
}

main()
