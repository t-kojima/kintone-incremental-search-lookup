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
  })
  return event
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
