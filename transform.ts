import consumers from 'stream/consumers'
import fsp from 'fs/promises'
import papa from 'papaparse'

import { get, mod, all } from 'shades'
// rambda.view = shades.get
// rambda.over = shades.mod
import rambda from 'rambda'

const rename = (mapping) => (object) => {
  object = { ...object }
  for (const [from, to] of Object.entries(mapping)) {
    object[to] = object[from]
    delete object[from]
  }
  return object
}


const lookup = rambda.flip(rambda.prop)

const self = {
  get: rambda.identity,
  mod: rambda.flip(rambda.applyTo),
}

const COLORS = {
  'W': 0,
  'U': 1,
  'B': 2,
  'R': 3,
  'G': 4,
}

const RARITIES = {
  'common': 'C',
  'mythic': 'M',
  'rare': 'R',
  'uncommon': 'U',
}

const check = (fn) => (...args) => {
  const value = fn(...args)
  if (typeof(value) === 'undefined') {
    console.error(`could not apply ${fn} to ${args}`)
  }
  return value
}

async function main() {

  let cards = await consumers.json(process.stdin)

  cards = mod(all)(rambda.compose(
    rename({
      'image_uris': 'image_uri',
      'cmc': 'mana_value',
      'collector_number': 'number',
      'color_identity': 'colors',
    }),
    mod(self)(card => {
      if (card.type_line.includes('Land')) {
        card.group = 'L'
        card.colors = card.color_identity
      } else if (card.colors.length === 0) {
        card.group = 'C'
      } else if (card.colors.length > 1) {
        card.group = 'M'
      } else {
        card.group = card.colors
      }
      return card
    }),
    mod('set')(rambda.toUpper),
    mod('colors')(
      rambda.compose(rambda.join(''), rambda.sortBy(lookup(COLORS)))
    ),
    mod('color_identity')(
      rambda.compose(rambda.join(''), rambda.sortBy(lookup(COLORS)))
    ),
    mod('rarity')(check(lookup(RARITIES))),
    mod('image_uris')(get('large')),
    rambda.pick([
      'name',
      'image_uris',
      'mana_cost',
      'cmc',
      'type_line',
      'oracle_text',
      'colors',
      'color_identity',
      'collector_number',
      'rarity',
      'set',
    ]),
  ))(cards)

  const file = await fsp.open('tmp.json', 'w')
  await file.write(JSON.stringify(cards))
  await file.close()

  const table = papa.unparse(cards, {
    header: true,
    newline: '\n',
    columns: [
      'set',
      'number',
      'name',
      'group',
      'colors',
      'rarity',
      'mana_cost',
      'mana_value',
      'type_line',
      'oracle_text',
      'image_uri',
    ],
  })
  process.stdout.write(table)

}

main()
