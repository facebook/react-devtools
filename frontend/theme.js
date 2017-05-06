// TODO Set default theme values, allow users to upload their own theme file(s).
// If a user uploads a theme, save it in localStorage for later

const DEFAULT_THEME = `
	.DevTools {
		background-color: #282a36;
		color: #f8f8f2;
	}

	.Toolbar {
		background-color: #44475a;
		color: #bebebe;
	}

	.Header {
		color: #bd93f9;
	}

	.NoContent {
		color: #666666;
	}

	.TabBar {
		background-color: #2e313f;
		color: #8fb1c5;
	}
	.Tab {
		background-color: #44465c;
	}
	.Tab:hover {
		background-color: #55576d;
	}
	.ActiveTab {
		background-color: #282a36;
	}

	.Breadcrumbs {
		background-color: #2e313f;
		color: #f8f8f2;
	}
	.Breadcrumb {
		background-color: #44465c;
	}
	.Breadcrumb:hover {
		background-color: #55576d;
	}
	.ActiveBreadcrumb {
		background-color: #282a36;
	}
	.CompositeBreadcrumb {
		color: #8fb1c5;
	}

	.NodeHover {
		background-color: #333649;
	}
	.NodeSelected {
		background-color: #44475a;
	}

	.ContextMenu {
		background-color: #b8b9c0;
	}
	.ContextMenuItem {
		color: #000;
	}
	.ContextMenuItemDisabled {
		color: #7f8087;
	}

	.Highlight {
		background-color: #44475a;
	}

  .JsxBracket {
		color: #f8f8f2;
  }
	.JsxTagName {
		color: #ff79c6;
	}
  .JsxAttributeName {
  	color: #50fa7b;
  }

  .CodeFunction {
  }
  .CodeAttribute {
  	color: #e6db74;
  }
  .CodeObject {
  }
  .CodeArray {
  }
  .CodeSymbol {
  }
  .CodeDate {
  }
  .CodeBoolean,
  .CodeNull,
  .CodeNumber {
  	color: #bd93f9;
  }
  .CodeString {
  	color: #e6db74;
  }
  .CodeEmpty {
  }

  .Arrow {
  	color: #666666;
  }
  .Arrow:hover {
  	color: #ededed;
  }
  .StatefulArrow {
  	color: #44bdce;
  }
`;

const style = document.createElement('style');
style.type = 'text/css';
style.innerHTML = DEFAULT_THEME;

document.head.appendChild(style);
