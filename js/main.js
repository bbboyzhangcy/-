function rgbaToHex( color ) {
  let values = color.match(/\((.+?)\)/)[1].split(',');
  let r = Math.floor(parseInt(values[0]));
  let g = Math.floor(parseInt(values[1]));
  let b = Math.floor(parseInt(values[2]));
  return '#' +
    ('0' + r.toString(16)).slice(-2) +
    ('0' + g.toString(16)).slice(-2) +
    ('0' + b.toString(16)).slice(-2);
}

function hexToRgba( sColor ) {
  let reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/
  if (sColor && reg.test(sColor) ) {
    if (sColor.length === 4) {
      let sColorNew = '#'
      for (let i = 1; i < 4; i += 1) {
          sColorNew += sColor.
          slice(i, i + 1).
          concat(sColor.slice(i, i + 1));
      }
      sColor = sColorNew;
    }
    let sColorChange = []
    for (let i = 1; i < 7; i += 2) {
      sColorChange.push(parseInt('0x' + sColor.slice(i, i + 2)));
    }
    return 'rgba(' + sColorChange.join(',') + ', 0.4)';
  } else {
    return sColor;
  }
}

function zero(num, len=2){
  return num.toString().padStart(len, '0');
}

$(function(){

  const localData = localStorage.getItem('students');
  const $dialog = $('.dialog');
  const $rightmenu = $('.rightmenu');
  let data = localData ? JSON.parse(localData) : {};
  let $drag = null;
  let editCol = 0;
  let editCell = 0;

  list();

  function list(){
    let { roomName, roomTeam, students } = data;
    let roomTemp = '';
    $.each(students, function(){
      let { row, col, list } = this;
      roomTemp += `<div 
      class="group" 
      style="grid-template-columns: repeat(${col}, 1fr);">`;
      $.each(list, function(){
        roomTemp +=  `
        <span
        draggable="true"
        data-avatar="${this.avatar || 'img/avatar.png'}"
        style="background-color:${hexToRgba(this.bgcolor)};"
        class="${this.show === 'hidden'?'blank':''}"
        >
        <u>${this.name}</u>
        <s>${this.team==='yes'?'组长':''}</s>
        </span>`;
      })
      roomTemp += `</div>`;
    })

    $('.main').css('grid-template-columns',function(){
      return students && students.reduce(function(temp,item){
        return temp + (item.col + 'fr ');
      },'');
    }).html( roomTemp );

    let rostTemp = roomName && roomTeam && `
      <polygon points="20,0 280,0 300,60 0,60"  />
      <text x="150" y="24" class="team">${roomName}</text>
      <text x="150" y="50" class="name small">${roomTeam}</text>
    `;
    $('.rostrum svg').html( rostTemp );

  }

  function save(){
    localStorage.setItem('students', JSON.stringify(data));
  }

  function openDialog(){
    $dialog.addClass('opened')
  }

  function closeDialog(){
    $dialog.removeClass('opened')
  }

  function hideRightmenu(){
    $rightmenu.css('visibility','hidden');
    $drag && $drag.removeClass('over');
  }

  $('.addbtn').on('click', openDialog );

  $dialog.on('click', '.closebtn, .cancelbtn', closeDialog )

  $dialog.on('input', '#groupTotal', function(){
    $('#groupInfo').html(`
      <p>
        <input type="number" class="input mini" placeholder="行数" title="行数">
        <input type="number" class="input mini" placeholder="列数" title="列数">
      </p>`.repeat( this.value ) 
    );
  }).on('click', '[type="submit"]', function(){
    let $name = $dialog.find('[name="name"]');
    let $team = $dialog.find('[name="team"]');
    let $total = $dialog.find('[name="total"]');
    let $info = $dialog.find('.info p');
    let students = [];

    $info.each(function( index ){
      let row = Number($(this).children('input:eq(0)').val().trim());
      let col = Number($(this).children('input:eq(1)').val().trim());
      let total = row*col;
      let item = {row,col,list:[]};
      for(let i=0; i < total; i++){
        item.list.push({
          name: `未命名`,
          bgcolor: '#000000',
          team: 'no',
          show: 'visible',
        })
      }
      students.push( item );
    })

    if($name.val().trim()===''){
      alert('请输入班级名称！');
      $name.focus();
      return false;
    }
    if($team.val().trim()===''){
      alert('请输入团队成员！');
      $team.focus();
      return false;
    }
    if($total.val().trim()===''){
      alert('请输入班级分组！');
      $total.focus();
      return false;
    }

    data.roomName = $name.val().trim();
    data.roomTeam = $team.val().trim();
    data.students = students;

    save();

    list();

    closeDialog();

  })

  $('.main').on('contextmenu', '.group > span', function(ev){
    ev.preventDefault();
    $drag = $(this);
    let left = ev.clientX;
    let top = ev.clientY;
    let width = $rightmenu.outerWidth();
    let height = $rightmenu.outerHeight();
    let maxLeft = $(window).width() - width;
    let maxBottom = $(window).height() - height;
    if ( left > maxLeft) left = maxLeft;
    if ( top > maxBottom) top = maxBottom;

    $drag.addClass('over');
    $rightmenu.css({
      visibility: 'visible',
      left,
      top,
    })
    let blank = $(this).hasClass('blank');
    $rightmenu.children('ul')[blank?'hide':'show']();
    $rightmenu.find('[name="show"]').val( blank ? 'hidden' : 'visible' );
    
    let name = $(this).find('u').text();
    let avatar = $(this).data('avatar');
    let color = $(this).attr('style').match(/background-color:(.+?);/)[1];
    let team = $(this).find('s').text();
    $rightmenu.find('[name="name"]').val( name ).select();
    $rightmenu.find('[name="avatar"]').attr('src', avatar);
    $rightmenu.find('[name="bgcolor"]').val( rgbaToHex(color) );
    $rightmenu.find('[name="team"]').val( team === '组长'? 'yes' : 'no' );
   
    editCol = $(this).closest('.group').index();
    editCell = $(this).index();
  }).on('dragstart', '.group > span', function(){
    hideRightmenu();
    $drag = $(this);
  }).on('dragover', '.group > span', function(ev){
    ev.preventDefault();
    $(this).addClass('over');
  }).on('dragleave', '.group > span', function(ev){
    ev.preventDefault();
    $(this).removeClass('over');
  }).on('drop', '.group > span', function(ev){

    if($(this).hasClass('blank')) return;

    $(this).removeClass('over');

    let target = $(this).html();
    $(this).html( $drag.html() );
    $drag.html(target);

    let fromI = $(this).closest('.group').index(); 
    let fromJ = $(this).index();
    let fromItem = data.students[fromI].list[fromJ];
    let {name,team} = fromItem;

    let toI = $drag.closest('.group').index(); 
    let toJ = $drag.index(); 
    let toItem = data.students[toI].list[toJ];

    fromItem.name = toItem.name;
    fromItem.team = toItem.team;
    toItem.name = name;
    toItem.team = team;

    save();

  })

  $(document).on('mousedown',function( ev ){
    if(!$rightmenu[0].contains(ev.target)) hideRightmenu();
  })

  $rightmenu.on('change','[name="show"]',function(){
    $rightmenu.children('ul')[this.value==='visible'?'show':'hide']();
  })

  $rightmenu.on('click','[type="submit"]',function(){
    let show = $rightmenu.find('[name="show"]').val();
    let name = $rightmenu.find('[name="name"]').val().trim();
    let avatar = $rightmenu.find('[name="avatar"]').attr('src');
    let bgcolor = $rightmenu.find('[name="bgcolor"]').val();
    let team = $rightmenu.find('[name="team"]').val();
    let target = data.students[editCol].list[editCell];
    target.show = show;
    target.name = name;
    target.avatar = avatar;
    target.bgcolor = bgcolor;
    target.team = team;

    if(show==='remove'){
      data.students[editCol].list.splice(editCell, 1);
      $drag.remove();
    }else if(show==='hidden'){
      $drag.addClass('blank');
    }else{
      $drag.removeClass('blank');
      $drag.css('background-color', hexToRgba(bgcolor) );
      $drag.find('u').text(name);
      $drag.data('avatar', avatar);
      $drag.find('s').text(team === 'yes'? '组长' : '');
    }

    save();

    hideRightmenu();
    
  })

  $('.uploadbtn').on('change','[type="file"]',function(){
    let $img = $(this).next('img');
    let xhr = new XMLHttpRequest();
    xhr.onload = function(){
      let res = JSON.parse(xhr.responseText);
      if(res.err > 0){
        console.error(res.desc);
      }else{
        $img.attr('src',res.result);
      }
    }
    xhr.open('POST','http://cloud.scnew.com.cn/api/user/upload');
    xhr.setRequestHeader('SC-Token','eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIyOSIsImF1ZCI6InRlc3QiLCJpYXQiOjE2MTg0NzU3MjQsInJvbGVzIjoiNCIsImV4cCI6MTk3ODQ3NTcyNH0.19x5PJCUsO6PEX5verFFmuPpQYMkxsShoTRkvW2w_2w');
    var form = new FormData();
    form.append('file', this.files[0]);
    xhr.send(form);




  })

  $('.exportbtn').on('change', '[type="file"]', function(){
    let file = this.files[0];
    let reader = new FileReader();
    reader.onload = function(){
      data = JSON.parse(this.result);
      save();
      list();
    }
    reader.readAsText(file);
  })

  $('.importbtn').on('click', function(){
    let downloadbtn = document.querySelector('#downloadbtn');
    let content = JSON.stringify(data);
    let d1 = new Date();
    let filename = data.roomName + '_' + d1.getFullYear() + zero(d1.getMonth()+1) + zero(d1.getDate()) + zero(d1.getHours()) + zero(d1.getMinutes());
    downloadbtn.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
    downloadbtn.download = filename + '.txt';
    downloadbtn.click();
  })

})