// TODO Set default theme values, allow users to upload their own theme file(s).
// If a user uploads a theme, save it in localStorage for later

export type Base16Theme = {
	base00: string; // Default Background
	base01: string; // Lighter Background (Used for status bars)
	base02: string; // Selection Background
	base03: string; // Comments, Invisibles, Line Highlighting
	base04: string; // Dark Foreground (Used for status bars)
	base05: string; // Default Foreground, Caret, Delimiters, Operators
	base06: string; // Light Foreground (Not often used)
	base07: string; // Light Background (Not often used)
	base08: string; // Variables, XML Tags, Markup Link Text, Markup Lists, Diff Deleted
	base09: string; // Integers, Boolean, Constants, XML Attributes, Markup Link Url
	base0A: string; // Classes, Markup Bold, Search Text Background
	base0B: string; // Strings, Inherited Class, Markup Code, Diff Inserted
	base0C: string; // Support, Regular Expressions, Escape Characters, Markup Quotes
	base0D: string; // Functions, Methods, Attribute IDs, Headings
	base0E: string; // Keywords, Storage, Selector, Markup Italic, Diff Changed
	base0F: string; // Deprecated, Opening/Closing Embedded Language Tags e.g.
};

const Apathy = {
	name: 'Apathy',
	base00: '#031A16',
	base01: '#0B342D',
	base02: '#184E45',
	base03: '#2B685E',
	base04: '#5F9C92',
	base05: '#81B5AC',
	base06: '#A7CEC8',
	base07: '#D2E7E4',
	base08: '#3E9688',
	base09: '#3E7996',
	base0A: '#3E4C96',
	base0B: '#883E96',
	base0C: '#963E4C',
	base0D: '#96883E',
	base0E: '#4C963E',
	base0F: '#3E965B',
}

const Dracula = {
	name: 'Dracula',
	base00: '#282a36',
	base01: '#3a3c4e',
	base02: '#4d4f68',
	base03: '#626483',
	base04: '#282a36',
	base05: '#e9e9f4',
	base06: '#f1f2f8',
	base07: '#f7f7fb',
	base08: '#ff79c6',
	base09: '#bd93f9',
	base0A: '#00f769',
	base0B: '#e5ee86',
	base0C: '#a1efe4',
	base0D: '#62d6e8',
	base0E: '#b45bcf',
	base0F: '#00f769',
};

const GoogleLight = {
	name: 'GoogleLight',
	base00: '#ffffff',
	base01: '#e0e0e0',
	base02: '#c5c8c6',
	base03: '#b4b7b4',
	base04: '#969896',
	base05: '#373b41',
	base06: '#282a2e',
	base07: '#1d1f21',
	base08: '#CC342B',
	base09: '#F96A38',
	base0A: '#FBA922',
	base0B: '#198844',
	base0C: '#3971ED',
	base0D: '#3971ED',
	base0E: '#A36AC7',
	base0F: '#3971ED',
}

const Materia = {
	name: 'Materia',
	base00: '#263238',
	base01: '#2C393F',
	base02: '#37474F',
	base03: '#707880',
	base04: '#C9CCD3',
	base05: '#CDD3DE',
	base06: '#D5DBE5',
	base07: '#FFFFFF',
	base08: '#EC5F67',
	base09: '#EA9560',
	base0A: '#FFCC00',
	base0B: '#8BD649',
	base0C: '#80CBC4',
	base0D: '#89DDFF',
	base0E: '#82AAFF',
	base0F: '#EC5F67',
};

const MexicoLight = {
	name: 'MexicoLight',
	base00: '#f8f8f8',
	base01: '#e8e8e8',
	base02: '#d8d8d8',
	base03: '#b8b8b8',
	base04: '#585858',
	base05: '#383838',
	base06: '#282828',
	base07: '#181818',
	base08: '#ab4642',
	base09: '#dc9656',
	base0A: '#f79a0e',
	base0B: '#538947',
	base0C: '#4b8093',
	base0D: '#7cafc2',
	base0E: '#96609e',
	base0F: '#a16946',
}

const Phd = {
	name: 'Phd',
	base00: '#061229',
	base01: '#2a3448',
	base02: '#4d5666',
	base03: '#717885',
	base04: '#9a99a3',
	base05: '#b8bbc2',
	base06: '#dbdde0',
	base07: '#ffffff',
	base08: '#d07346',
	base09: '#f0a000',
	base0A: '#fbd461',
	base0B: '#99bf52',
	base0C: '#72b9bf',
	base0D: '#5299bf',
	base0E: '#9989cc',
	base0F: '#b08060',
};

module.exports = Phd;
