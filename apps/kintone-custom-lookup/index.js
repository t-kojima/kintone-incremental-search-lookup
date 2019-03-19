/* eslint-disable no-undef */
import Vue from 'vue'
import { createId } from '../utils'
import LookupField from './lookup-field'
import template from './template.html'

// プラグイン設定の読み込み ＆ disabled判定
const config = kintone.$PLUGIN_ID
  ? Object.values(kintone.plugin.app.getConfig(kintone.$PLUGIN_ID)).map(_ => JSON.parse(_))
  : []
function isDisabled(field) {
  const setting = config.find(_ => _.code === field.var)
  return (setting && setting.disabled) || false
}

const { lookups, schema } = cybozu.data.page.FORM_DATA

kintone.events.on(['mobile.app.record.create.show', 'mobile.app.record.edit.show'], event => {
  lookups.forEach(lookup => {
    const {
      keyMapping: { fieldId },
    } = lookup
    const baseLookups = document.getElementsByClassName(`field-${fieldId}`)
    const field = schema.table.fieldList[fieldId]
    if (baseLookups.length && field && !isDisabled(field)) {
      const [baseLookup] = baseLookups
      const value = event.record[field.var].value || ''
      baseLookup.vm = createLookupViewModel(baseLookup, lookup, schema, value)
    }
    Object.values(schema.subTable).forEach(sub => {
      const subTableField = sub.fieldList[fieldId]
      if (baseLookups.length && subTableField && !isDisabled(subTableField)) {
        Array.from(baseLookups).forEach((baseLookup, i) => {
          const value = event.record[sub.var].value[i].value[subTableField.var].value || ''
          baseLookup.vm = createLookupViewModel(baseLookup, lookup, schema, value, { id: sub.id, var: sub.var, index: i })
        })
      }
    })
  })
  return event
})

// サブテーブルのレコード増減
Object.values(schema.subTable).forEach(sub => {
  kintone.events.on([`mobile.app.record.create.change.${sub.var}`, `mobile.app.record.edit.change.${sub.var}`], event => {
    lookups.forEach(lookup => {
      const {
        keyMapping: { fieldId },
      } = lookup
      if (sub.fieldList[fieldId]) {
        const baseLookups = document.getElementsByClassName(`field-${fieldId}`)
        Array.from(baseLookups).forEach((baseLookup, i) => {
          if (!baseLookup.vm) {
            baseLookup.vm = createLookupViewModel(baseLookup, lookup, schema, '', { id: sub.id, var: sub.var, index: i })
          }
        })
      }
    })
    return event
  })
})

function createLookupViewModel(parent, lookup, schema, value, sub) {
  const id = `js-lookup-field-${createId()}-${lookup.keyMapping.fieldId}`
  parent.insertAdjacentHTML('afterend', `<div id="${id}" />`)
  parent.style.display = 'none'
  return new Vue({
    el: `#${id}`,
    data: { id, parent, lookup, schema, value, sub },
    components: { 'lookup-field': LookupField },
    template,
  })
}
