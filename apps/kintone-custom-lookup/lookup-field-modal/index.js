import Vue from 'vue'
import template from './template.html'

export function createLookupModalViewModel(self, id, field, records) {
  document.getElementById('main').insertAdjacentHTML('beforeend', `<div id="${id}"></div>`)
  return new Vue({
    el: `#${id}`,
    data: {
      records,
      input: '',
      active: false,
    },
    methods: {
      onClickItem(index) {
        const record = this.filterdRecords[index]
        // self.callback(record)
        this.active = false
      },
      onSearch(value) {
        this.input = value
        this.active = true
      },
      close() {
        this.active = false
      },
    },
    computed: {
      filterdRecords() {
        const words = this.input
          .replace(/　/g, ' ')
          .split(' ')
          .filter(_ => _)
        return words.length
          ? this.records.filter(_ => {
              //   const text = `
              //   ${_['品名1'].value}
              //   ${_['品名2'].value}
              //   ${_['品名3'].value}
              // `
              const text = ''
              return words.every(word => text.includes(word))
            })
          : this.records
      },
    },
    template,
  })
}
