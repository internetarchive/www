function submitFormWith({ method = 'POST', fields, action }) {
  const $form = $('<form />', {
    action,
    method,
    css: { display: 'none' },
    target: '_top',
  }).appendTo(document.body);

  Object.keys(fields).forEach((name) => {
    $('<input />', {
      type: 'text',
      name,
      value: fields[name],
    }).appendTo($form);
  });

  $form.submit();
}

export default submitFormWith;
