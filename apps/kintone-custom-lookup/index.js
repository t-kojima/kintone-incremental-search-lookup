/* eslint-disable no-undef */
import Vue from 'vue'
import kintoneUtility from 'kintone-utility'
import template from './template.html'
import { createId } from '../utils'
import LookupField from './lookup-field'

const { lookups, schema } = cybozu.data.page.FORM_DATA

console.log(cybozu.data.page.FORM_DATA)

kintone.events.on('mobile.app.record.create.show', event => {
  lookups.forEach(({ keyMapping: { fieldId } }) => {
    const [baseLookup] = document.getElementsByClassName(`field-${fieldId}`)
    const field = schema.table.fieldList[fieldId]
    if (baseLookup && field) {
      const id = `js-lookup-field-${createId()}-${fieldId}`
      baseLookup.insertAdjacentHTML('afterend', `<div id="${id}" />`)
      baseLookup.style.display = 'none'
      createLookupViewModel(this, id, field)
    }
  })

  return event
})

Object.values(schema.subTable).forEach(sub => {
  kintone.events.on(`mobile.app.record.create.change.${sub.var}`, event => {
    // サブテーブルのViewModelの増減はここでやる
    console.log('subtable')
  })
})

function createLookupViewModel(self, id, field) {
  // Vue.component('lookup-field', LookupField)
  new Vue({
    el: `#${id}`,
    data: {
      id,
      field,
    },
    components: {
      'lookup-field': LookupField,
    },
    template: `<lookup-field id="id" :field="field"></lookup-field>`,
  })
}