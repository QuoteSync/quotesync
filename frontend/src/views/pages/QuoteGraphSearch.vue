const openQuoteModal = (quote, index) => {
  console.log('QuoteGraphSearch - openQuoteModal called with quote:', quote.id, 'index:', index);
  
  // Normal flow - open the modal
  console.log('QuoteGraphSearch - Opening modal');
  selectedQuote.value = quote;
  selectedQuoteIndex.value = index;
  showQuoteModal.value = true;
};

// Add a watch for showQuoteModal to handle modal state
watch(() => showQuoteModal.value, (newValue) => {
  console.log('QuoteGraphSearch - showQuoteModal changed:', newValue);
  if (!newValue) {
    // Modal was closed, clear the selected quote
    selectedQuote.value = null;
    selectedQuoteIndex.value = -1;
  }
}, { immediate: true }); 