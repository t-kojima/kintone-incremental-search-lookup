import Vue from 'vue'
import template from './template.html'
import bulma from '../bulma.scss'
import style from './51-modern-default.css'

bulma.use()
style.use()

new Vue({
  el: '#root',
  data: {
    pid: kintone.$PLUGIN_ID,
    lookups: [],
  },
  created() {
    const config = Object.values(kintone.plugin.app.getConfig(this.pid)).map(_ => JSON.parse(_))
    kintone
      .api(kintone.api.url('/k/v1/preview/app/form/fields', true), 'GET', { app: kintone.app.getId() })
      .then(({ properties }) => {
        const tables = Object.values(properties)
          .filter(({ lookup }) => lookup)
          .map(({ code, label }) => {
            const item = config.find(_ => _.code === code)
            return { code, label, disabled: (item && item.disabled) || false }
          })
        const subtables = Object.values(properties)
          .filter(({ fields }) => fields)
          .map(({ fields }) =>
            Object.values(fields)
              .filter(({ lookup }) => lookup)
              .map(({ code, label }) => {
                const item = config.find(_ => _.code === code)
                return { code, label, disabled: (item && item.disabled) || false }
              })
          )
        this.lookups = [...tables, ...subtables.flat()]
      })
  },
  methods: {
    cancel() {
      history.back()
    },
    save() {
      const config = this.lookups.reduce((x, y, i) => ({ ...x, [i]: JSON.stringify(y) }), {})
      kintone.plugin.app.setConfig(config)
    },
  },
  template,
})
