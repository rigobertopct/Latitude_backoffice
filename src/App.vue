<script setup></script>

<template>
  <div id="app">
    <router-view />
  </div>
</template>

<style>
:root {
  --latitude-deep-blue: #284A81;
  --latitude-blue-gray: #B4BFCC;
  --latitude-orange: #FF9933;
  --latitude-white: #FFFFFF;
  --layout-bg: #F5F6F8;
  --border-color: #E5E7EB;
  --card-bg: #FFFFFF;
  --text-primary: #1a1a1a;
  --text-secondary: #6b7280;
}

html.theme-dark {
  --layout-bg: #1a1d24;
  --border-color: #2d3239;
  --card-bg: #23262d;
  --text-primary: #f0f1f3;
  --text-secondary: #9ca3af;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--layout-bg);
  color: var(--text-primary);
}
</style>
