const mainContainer = document.querySelector("#main-container")
const spreadsheetData = []
let rows = 10
let columns = 5
initEvents() // starting point

function initEvents() {
	mainContainer.innerHTML = ""
	initCreateSheet()
	document.onclick = hideMenu
}

// initialize the rows/cols for creating the sheet
function initCreateSheet() {
	for (let colLoop=0; colLoop < rows+1;colLoop++){
		let colObj = {
			col: colLoop,
			columns: []
		}

		for (let rowLoop=0; rowLoop < columns+1;rowLoop++) {
			let rowObj = getRowObjectData(rowLoop, colLoop)
			colObj.columns.push(rowObj)
		}
		spreadsheetData.push(colObj)
	}

	if (spreadsheetData.length > 0) drawSheet()
}

// function to start sheet drawing
function drawSheet() {
	for (let sheetLoop=0; sheetLoop < spreadsheetData.length; sheetLoop++) {
		const rowElem = document.createElement("div")
		rowElem.className= 'rows'
		rowElem.id = sheetLoop

		let sheet = spreadsheetData[sheetLoop]
		for (let sheetCellLoop=0; sheetCellLoop<sheet.columns.length;sheetCellLoop++) {
			let cellData = createCell(sheet.columns[sheetCellLoop], sheetCellLoop)
			rowElem.append(cellData)
		}
		mainContainer.append(rowElem)
	}
}

/*
Name the spreadsheet rows- A B C D etc etc
works on the logic of getting the char code associated with an integer
*/
function nameColumns (index) {
	if(!index || index == 0) index= 1

	let name  = ''
	if(index <= 26) {
		let toFind  = +index + 64
		name = String.fromCharCode(toFind)
	} else {
		name = 'A'+String.fromCharCode(index)
	}
	return name;
}

/*
 sub function used to create cell
 params - 
 class - class of input element
 value - value of input element (A-B-C OR 1 2 3 etc)
 isDisabled - To ensure the header remain readonly
 isHeader - check if the element is for header (A-B-C OR 1 2 3 etc)
 identifer -  to identify in UI if the header is a row header or column header
 cellType - to identify in UI if the input is a row or column
*/
function createCell (params, rowIndex = '') {
	const inpElem = document.createElement("input")
	inpElem.className= params.class
	//inpElem.id= params.identifer
	inpElem.value= params.value
	inpElem.readOnly= params.isDisabled
	if (params.identifer && params.identifer != '') inpElem.dataset.identifer= params.identifer
	if (params.cellType && params.cellType != '') inpElem.dataset.cell_type= params.cellType
	if (rowIndex && rowIndex != '') inpElem.dataset.rowset = rowIndex
	if (params.isHeader && params.value != '0') {
		inpElem.addEventListener("contextmenu", function() {
		  rightClick(this)
		})
		inpElem.oncontextmenu = preventDefault

		if(params.cellType == "col") {
			inpElem.addEventListener("click", function() {
			  sortColumn(this)
			})
		}
		
	}
	return inpElem
}

/*
Prepare the data object to be used in createCell function
Its a middleware function used to create the cell object
*/
function getRowObjectData (rowLoop, colLoop) {
	let columName = ''
	if (rowLoop > 0) columName = nameColumns(rowLoop)

	let rowObj = {
		row: rowLoop,
		identifer: rowLoop == 0 || colLoop == 0 ? `cell-${colLoop}.${rowLoop}` : '',
		value: rowLoop == 0 ? colLoop : (colLoop == 0 ? columName : ''),
		class: rowLoop == 0 ? 'row-cell row-header' : (colLoop == 0 ? 'row-cell cell-header' : 'row-cell'),
		isDisabled: rowLoop == 0 || colLoop == 0 ? true : false,
		cellType: rowLoop == 0 ? 'row' : (colLoop == 0 ? 'col' : ''),
		isHeader: rowLoop == 0 || colLoop == 0? true : false
	}
	return rowObj
}

/* Hide the context menu*/
function hideMenu(){ 
	document.getElementById("contextMenu").innerHTML = ''
    document.getElementById("contextMenu").style.display = "none" 
} 

/* Prevent the context default actions and also a dynamic position set*/
function preventDefault (evt) {
	evt.preventDefault()
	let menu = document.getElementById("contextMenu") 
	menu.style.left = `${evt.pageX}px`
    menu.style.top = `${evt.pageY}px`
}

/* 
Custom context menu function
Populate the context menu options and display to user
*/
function rightClick(elem){
   	let cellType = elem.getAttribute("data-cell_type")
	let clickedOn = elem.getAttribute("data-identifer")
	let menu = document.getElementById("contextMenu") 
	let parentNode = elem.parentNode

	let params = {
		cellType,
		clickedOn,
		parentNode,
		element: elem
	}
	
    if (document.getElementById("contextMenu").style.display == "block"){ 
        hideMenu()
    } else { 
        let menuList = document.createElement("div")
		menuList.className= 'menu'

        let hrefOptions = [{text:'Insert After', tag: 'after'}, {text: 'Insert Before', tag: 'before'}]
        if(elem.classList.contains('cell-header')) {
			hrefOptions = [{text:'Insert Left', tag: 'left'}, {text: 'Insert Right', tag: 'right'}]
		}
        
        hrefOptions.forEach(function(opt){
        	let aItem = document.createElement('a')
		    let linkText = document.createTextNode(opt.text)
		    aItem.appendChild(linkText);
		    aItem.title = opt.text;
		    aItem.href = "#";
		    aItem.dataset.tag= opt.tag
		    aItem.onclick = function () {
			    onClickContextOptions(this, params)
			}
		    menuList.append(aItem);
        })
       	
       	menu.append(menuList)
        menu.style.display = 'block'
    } 
} 

/*
Function trigger when one of the context options is selected by user
Assists in creating a new row or column
*/
function onClickContextOptions(evnt, params) {
	let contextTag = evnt.getAttribute("data-tag")
	let cellType = params.cellType
	let clickedOn = params.clickedOn
	
	if (cellType == 'row') {
		createNewRow(params, contextTag)
	} else if(cellType == 'col'){
		createNewColumn(params, contextTag)
	}
}

/*
To create a new horizontal row
params - function params - parent node of clicked item
position - Insert above or below
*/
function createNewRow(params, position='after') {
	let parent = params.parentNode
	let totalRows = spreadsheetData.length
	const rowElem = document.createElement("div")
	rowElem.className= 'rows'
	
	let nxtColumn = spreadsheetData.length
	let colObj = {
		col: nxtColumn,
		columns: []
	}

	// mantain the main spreadsheetData array for a new row object
	for (let rowLoop=0; rowLoop < columns+1;rowLoop++) {
		let tmp = getRowObjectData(rowLoop, nxtColumn)
		colObj.columns.push(tmp)
		let cellData = createCell(tmp, rowLoop)
		rowElem.append(cellData)
	}
	spreadsheetData.push(colObj)
	
	// place the row as per user selection from context menu
	if (position== 'after') parent.after(rowElem)
	else parent.before(rowElem)

	// Reset the index and row Id as elements with be added in middle	
	const allRows = document.querySelectorAll(".row-header")
	allRows.forEach((item, index) => {
	  item.parentNode.id = index
	  item.dataset.identifer= `cell-${index}.0`
	  item.value= index
	})
	rows++;
}

/*
To create a new vertical column
params - function params - parent node of clicked item
position - Insert left or right
*/
function createNewColumn(params, position='left') {
	let parent = params.parentNode
	let totalRows = spreadsheetData.length
	let headerRow = spreadsheetData[0]
	let indexofClicked = _.findIndex(headerRow.columns, sheet => {
	    return sheet.identifer == params.clickedOn
	})
	
	for (let colLoop=0; colLoop < totalRows; colLoop++){
		let newObj = {
			cellType: 'col',
			class: colLoop == 0 ? 'row-cell cell-header' : 'row-cell',
			identifer: "",
			isDisabled: colLoop == 0 ? true : false,
			isHeader: colLoop == 0 ? true : false,
			row: indexofClicked,
			value:  ''
		}

		// mantain the main spreadsheetData array for a new row object
		spreadsheetData[colLoop].columns.splice(indexofClicked, 0, newObj)
		let colRows = spreadsheetData[colLoop].columns
		for (let innerloop=0; innerloop < colRows.length; innerloop++) {
			spreadsheetData[colLoop].columns[innerloop].row = innerloop
			spreadsheetData[colLoop].columns[innerloop].identifer = `cell-${colLoop}.${innerloop}`
		}

		// place the row as per user selection from context menu
		let cellData = createCell(newObj, colLoop)
		let rowData = document.getElementById(colLoop) 
		let allRows = rowData.querySelectorAll(".row-cell")
		if(position == 'left') allRows[indexofClicked].before(cellData)
		else allRows[indexofClicked].after(cellData)
	}

	for (let colLoop=0; colLoop < totalRows; colLoop++){
		let rowData = document.getElementById(colLoop) 
		let allRows = rowData.querySelectorAll(".row-cell")

		allRows.forEach((child, index) => {
		  	child.dataset.identifer= `cell-${colLoop}.${index}`
		  	child.dataset.rowset= index
		})
	}

	// Reset the index and row Id as elements with be added in middle	
	let rowHeaderData = document.getElementById(0) 
	let rowHeaderRows = rowHeaderData.querySelectorAll(".row-cell")
	rowHeaderRows.forEach((child, index) => {
		if(index > 0) child.value = nameColumns(index)
	})
	columns++
}

/* 
function to sort the rows
*/
function sortColumn(elem) {
	let forRow = elem.getAttribute("data-rowset")
	let allElements = document.querySelectorAll(`[data-rowset='${forRow}']`)
	
	let sortToDo = ''
	if(!allElements[0].dataset.sortBy || allElements[0].dataset.sortBy == '') sortToDo = 'asc' 
	else sortToDo = allElements[0].dataset.sortBy
	
	let dataElems = []
	allElements.forEach(function(child, index) {
		if(index > 0 && child.value != '') {
			dataElems.push(child.value)
		}
	})

	let sorted
	if (sortToDo =='asc') sorted = dataElems.sort()
	else sorted = dataElems.sort().reverse() // for desc order

	for (let rowLoop = 0; rowLoop <sorted.length;rowLoop++) {
		allElements[rowLoop+1].value = sorted[rowLoop]
	}

	let nxtSort = sortToDo == 'asc' ? 'desc': 'asc'
	allElements[0].dataset.sortBy = nxtSort
}