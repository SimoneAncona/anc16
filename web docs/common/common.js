let tlLight1 = "rgb(240, 240, 240)";
let tlDark1 = "rgb(54, 54, 54)";
let tlDark2 = "rgb(85, 85, 85)";
let tlColor1 = "rgb(75, 132, 196)";
let tlLight2 = "rgb(230, 230, 230)";
let tlColor1Darker = "rgb(41, 61, 83)";

let tlCode1 = "rgb(202, 148, 0)";
let tlCode2 = "rgb(13, 148, 165)";
let tlCode3 = "rgb(126, 12, 12)";
let tlCode4 = "rgb(51, 138, 51)";
let tlCode5 = "rgb(167, 103, 31)";
let tlCode6 = "rgb(46, 91, 117)";

let tdLight1 = "rgb(59, 59, 59)";
let tdDark1 = "rgb(240, 240, 240)";
let tdDark2 = "rgb(200, 200, 200)";
let tdColor1 = "rgb(103, 160, 224)";
let tdLight2 = "rgb(50, 50, 50)";
let tdColor1Darker = "rgb(75, 132, 196)";

let tdCode1 = "rgb(230, 204, 123)";
let tdCode2 = "rgb(130, 220, 246)";
let tdCode3 = "rgb(236, 88, 88)";
let tdCode4 = "rgb(77, 158, 77)";
let tdCode5 = "rgb(240, 150, 56)";
let tdCode6 = "rgb(140, 179, 201)";

document.getElementById("theme").onchange = function() {
	let selectedOption = this[this.selectedIndex];
	let selectedText = selectedOption.text;
	if(selectedText == "Light") {
		document.documentElement.style.setProperty("--light1", tlLight1);
		document.documentElement.style.setProperty("--dark1", tlDark1);
		document.documentElement.style.setProperty("--dark2", tlDark2);
		document.documentElement.style.setProperty("--color1", tlColor1);
		document.documentElement.style.setProperty("--light2", tlLight2);
		document.documentElement.style.setProperty("--color1-darker", tlColor1Darker);
		document.documentElement.style.setProperty("--code-color1", tlCode1);
		document.documentElement.style.setProperty("--code-color2", tlCode2);
		document.documentElement.style.setProperty("--code-color3", tlCode3);
		document.documentElement.style.setProperty("--code-color4", tlCode4);
		document.documentElement.style.setProperty("--code-color5", tlCode5);
		document.documentElement.style.setProperty("--code-color6", tlCode6);
		return;
	}
	document.documentElement.style.setProperty("--light1", tdLight1);
	document.documentElement.style.setProperty("--dark1", tdDark1);
	document.documentElement.style.setProperty("--dark2", tdDark2);
	document.documentElement.style.setProperty("--color1", tdColor1);
	document.documentElement.style.setProperty("--light2", tdLight2);
	document.documentElement.style.setProperty("--color1-darker", tdColor1Darker);
	document.documentElement.style.setProperty("--code-color1", tdCode1);
	document.documentElement.style.setProperty("--code-color2", tdCode2);
	document.documentElement.style.setProperty("--code-color3", tdCode3);
	document.documentElement.style.setProperty("--code-color4", tdCode4);
	document.documentElement.style.setProperty("--code-color5", tdCode5);
	document.documentElement.style.setProperty("--code-color6", tdCode6);
}

function goto(address) {
	window.location.replace(address);
}