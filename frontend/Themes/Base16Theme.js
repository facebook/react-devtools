/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

export type Base16Theme = {
	name: string;
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
