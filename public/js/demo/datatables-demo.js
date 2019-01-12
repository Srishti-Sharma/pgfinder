// Call the dataTables jQuery plugin
$(document).ready(function() {
  $('#dataTable').DataTable();
});

function readURL(input) {
  if (input.files && input.files[0]) {
  var reader = new FileReader();
  reader.onload = function(e) { 
  $('#imagePreview').css('background-image', 'url('+e.target.result +')');
  $('#imagePreview').show();
  }
  console.log(input.files[0]);
  reader.readAsDataURL(input.files[0]);
  }
  }
  
  $("#imageUpload").change(function() {
  readURL(this);
  });
