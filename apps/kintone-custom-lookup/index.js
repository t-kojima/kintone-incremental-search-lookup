/* eslint-disable no-undef */
import Vue from 'vue'
import { createId } from '../utils'
import LookupField from './lookup-field'
import template from './template.html'

// TODO callbackのイベント処理
// TODO edit show

// プラグイン設定の読み込み ＆ disabled判定
const config = kintone.$PLUGIN_ID
  ? Object.values(kintone.plugin.app.getConfig(kintone.$PLUGIN_ID)).map(_ => JSON.parse(_))
  : []
function isDisabled(field) {
  const setting = config.find(_ => _.code === field.var)
  return (setting && setting.disabled) || false
}

const { lookups, schema } = cybozu.data.page.FORM_DATA

kintone.events.on('mobile.app.record.create.show', event => {
  lookups.forEach(lookup => {
    const {
      keyMapping: { fieldId },
    } = lookup
    const [baseLookup] = document.getElementsByClassName(`field-${fieldId}`)
    const field = schema.table.fieldList[fieldId]
    if (baseLookup && field && !isDisabled(field)) {
      baseLookup.vm = createLookupViewModel(baseLookup, lookup, schema)
    }
    Object.values(schema.subTable).forEach(sub => {
      const subTableField = sub.fieldList[fieldId]
      if (baseLookup && subTableField && !isDisabled(subTableField)) {
        baseLookup.vm = createLookupViewModel(baseLookup, lookup, schema, { id: sub.id, var: sub.var, index: 0 })
      }
    })
  })
  return event
})

// サブテーブルのレコード増減
Object.values(schema.subTable).forEach(sub => {
  kintone.events.on(`mobile.app.record.create.change.${sub.var}`, event => {
    lookups.forEach(lookup => {
      const {
        keyMapping: { fieldId },
      } = lookup
      if (sub.fieldList[fieldId]) {
        const baseLookups = document.getElementsByClassName(`field-${fieldId}`)
        Array.from(baseLookups).forEach((baseLookup, i) => {
          if (!baseLookup.vm) {
            baseLookup.vm = createLookupViewModel(baseLookup, lookup, schema, { id: sub.id, var: sub.var, index: i })
          }
        })
      }
    })
    return event
  })
})

function createLookupViewModel(parent, lookup, schema, sub) {
  const id = `js-lookup-field-${createId()}-${lookup.keyMapping.fieldId}`
  parent.insertAdjacentHTML('afterend', `<div id="${id}" />`)
  // parent.style.display = 'none'
  return new Vue({
    el: `#${id}`,
    data: { id, parent, lookup, schema, sub },
    components: { 'lookup-field': LookupField },
    methods: {
      onSelect(record) {
        // TODO: このレコードを外から取得したいよね
        // EventListener -> kintone.app.record.getFieldElementがモバイルで使えない
        // EventEmitter -> イベントのインスタンスをどこに置く？window？
      },
    },
    template,
  })
}
