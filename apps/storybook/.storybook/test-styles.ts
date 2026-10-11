const style = document.createElement('style');
style.dataset['test'] = 'freeze-motion';
style.textContent =
  '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }';
document.head.append(style);
