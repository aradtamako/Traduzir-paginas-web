function getItems (sheetName) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName)
  const rows = sheet.getDataRange().getValues()
  const keys = rows.splice(0, 1)[0]

  const items = rows.map(row => {
    let obj = {}
    row.map((item, index) => {
      obj[String(keys[index])] = String(item)
    })
    return obj
  })

  return items.sort((a, b) => {
    return b['ko'].length - a['ko'].length
  })
}

function doGet () {
  const items = getItems('Sheet1')
  return ContentService
    .createTextOutput(JSON.stringify(items, null, 2))
    .setMimeType(ContentService.MimeType.JSON)
}
