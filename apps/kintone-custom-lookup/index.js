/* eslint-disable no-undef */
import Vue from 'vue'
import kintoneUtility from 'kintone-utility'
import template from './template.html'
import { createId } from '../utils'
import LookupField from './lookup-field'

const { lookups, schema } = cybozu.data.page.FORM_DATA

console.log(cybozu.data.page.FORM_DATA)

kintone.events.on('mobile.app.record.create.show', event => {
  lookups.forEach(lookup => {
    const { keyMapping: { fieldId } } = lookup
    const [baseLookup] = document.getElementsByClassName(`field-${fieldId}`)
    const field = schema.table.fieldList[fieldId]
    if (baseLookup && field) {
      createLookupViewModel(baseLookup, lookup, field)
    }
  })
  return event
})

Object.values(schema.subTable).forEach(sub => {
  kintone.events.on(`mobile.app.record.create.change.${sub.var}`, event => {
    // TODO: サブテーブルのViewModelの増減はここでやる
    console.log('subtable')
    return event
  })
})

function createLookupViewModel(parent, lookup, field) {
  const id = `js-lookup-field-${createId()}-${lookup.keyMapping.fieldId}`
  parent.insertAdjacentHTML('afterend', `<div id="${id}" />`)
  // parent.style.display = 'none'
  new Vue({
    el: `#${id}`,
    data: { id, lookup, field },
    components: { 'lookup-field': LookupField },
    template: `<lookup-field id="id" :lookup="lookup" :field="field"></lookup-field>`,
  })
}
