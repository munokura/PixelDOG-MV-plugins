//=============================================================================
// FaceChatBase.js
// ----------------------------------------------------------------------------
// (C)2017 PixelDOG
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//=============================================================================
/*:
@plugindesc Adds a conversation feature via Face Chat.
@author Shio_inu
@url https://pixeldog.x.2nt.com/material_script.html
@license MIT License

@help
English Help Translator: munokura
This is an unofficial English translation of the plugin help,
created to support global RPG Maker users.
Feedback is welcome to improve translation quality
(see: https://github.com/munokura/PixelDOG-MV-plugins ).
Original plugin by Shio_inu.
Please check the latest official version at:
https://pixeldog.x.2nt.com/material_script.html
-----
Adds a conversation feature via Face Chat.

# Plugin Commands

## Start a face chat (untitled) with face graphics named Alex, Brian,
 and Carol.
FaceChat start alex,brian,carol

## Start a face chat (titled "CHAT") with face graphics named Daisy,
 Enryu, and Falcon.
FaceChat start daisy,enryu,falcon CHAT

## Characters Alex and Brian speak (play lip-sync animation).
FaceChat talk alex,brian

## Change characters Carol and Daisy's facial expression to number 4.
FaceChat emotion carol,daisy 4

## Display speech bubble number 8 for characters Daisy and Enryu.
FaceChat balloon daisy,enryu 8

## Play motion number 5 for characters Gomez and Helen.
FaceChat animation gomez,helen 5

## Characters Alex and Brian join the conversation from the right over
 120 frames.
FaceChat add alex,brian right 120

## Characters Carol and Daisy leave the conversation from the left over
 60 frames.
FaceChat remove carol,daisy left 60

## End the conversation.
FaceChat end


When entering a message, you can set the
facial expression and lip-sync for that character by setting a face
graphic with the same file name as the FaceChat file.

The direction and frame
number for joining and leaving can be omitted.
By default, players will
join from the right and leave from the left, with movement times of 120
frames each.


last update : 2017/02/05 v2.00

@param Face size
@desc The size of the face graphic.
@default 144

@param Margin
@desc The amount of space between face graphics.
@default 32

@param Eye Anim Num
@desc The number of blinks.
@default 3

@param Mouse Anim Num
@desc The number of lip-syncs.
@default 4
*/


/*:ja
@plugindesc フェイスチャットによる会話機能を追加します。
@author しおいぬ

@help

# プラグインコマンド

## 顔グラフィック名alex,brian,carolによるフェイスチャット(タイトルなし)を
開始する
FaceChat start alex,brian,carol
フェイスチャット 開始 alex,brian,carol

## 顔グラフィック名daisy,enryu,falconによるフェイスチャット
(タイトル「雑談」)を開始する
FaceChat start daisy,enryu,falcon 雑談
フェイスチャット 開始 daisy,enryu,falcon 雑談

## キャラクターalex,brianがしゃべる(口パクアニメーションの再生)
FaceChat talk alex,brian
フェイスチャット 会話 alex,brian

## キャラクターcarol,daisyの表情を4番に変更
FaceChat emotion carol,daisy 4
フェイスチャット 表情 carol,daisy 4

## キャラクターdaisy,enryuに8番のふきだしを表示
FaceChat balloon daisy,enryu 8
フェイスチャット ふきだし daisy,enryu 8

## キャラクターgomez,helenに5番のモーションを再生
FaceChat animation gomez,helen 5
フェイスチャット モーション gomez,helen 5

## キャラクターalex,brianが120フレームかけて右から会話に途中参加
FaceChat add alex,brian right 120
フェイスチャット 参加 alex,brian 右 120

## キャラクターcarol,daisyが60フレームかけて左から会話から退場
FaceChat remove carol,daisy left 60
フェイスチャット 退場 carol,daisy 左 60

## 会話を終了する
FaceChat end
フェイスチャット 終了

メッセージ入力の際、フェイスチャットと同じファイル名の顔グラフィックを
設定することで、そのキャラクターの表情や口パクを一括で設定できます。

参加、退場時の方向とフレーム数は省略することが可能です。
省略時は参加は右から、退場は左から、移動時間は共に120フレームとなります。

last update : 2017/02/05 v2.00 大幅な仕様変更

@param Face size
@desc 顔グラフィックのサイズです。
@default 144

@param Margin
@desc 顔グラフィック同士の間隔の広さです。
@default 32

@param Eye Anim Num
@desc まばたきの枚数です。
@default 3

@param Mouse Anim Num
@desc 口パクの枚数です。
@default 4
*/

(function () {

  var parameters = PluginManager.parameters('PD_FaceChat');
  var faceSize = Number(parameters['Face size'] || 144);
  var margin = Number(parameters['Margin'] || 32);
  var eyeAnimNum = Number(parameters['Eye Anim Num'] || 3);
  var mouseAnimNum = Number(parameters['Mouse Anim Num'] || 4);

  /* 以下は詳細設定
   * より細かく作りこみたい時のみ変更してください。
   */
  //表情パターンごとに表示される吹き出し
  var balloonNum = [0, 3, 5, 0, 6, 1, 11, 4, 0];
  //表情パターンごとに表示されるTweenアニメーション
  var animNum = [0, 1, 6, 0, 3, 4, 2, 5, 0];
  //ウィンドウの高さ
  var windowHeight = 180;
  //瞬きの間隔(最小フレーム、最大フレーム)
  var eyeFrameMin = 90;
  var eyeFrameMax = 180;
  //口パクアニメーションの1コマの表示時間
  var mouseAnimFrame = Math.floor(12 / (mouseAnimNum - 1));
  //瞬きアニメーションの1コマの表示時間
  var eyeAnimFrame = Math.floor(8 / (eyeAnimNum - 1));

  var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function (command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    if (command === 'FaceChat' && SceneManager._scene.constructor.name == 'Scene_Map') {
      switch (args[0]) {
        case 'start':
          SceneManager._scene.startChat(String(args[1]).split(','), String(args[2]));
          break;
        case 'talk':
          SceneManager._scene.talk(String(args[1]).split(','));
          break;
        case 'emotion':
          SceneManager._scene.emotion(String(args[1]).split(','), Number(args[2]), false);
          break;
        case 'balloon':
          SceneManager._scene.balloon(String(args[1]).split(','), Number(args[2]));
          break;
        case 'animation':
          SceneManager._scene.startAnim(String(args[1]).split(','), Number(args[2]));
          break;
        case 'add':
          SceneManager._scene.addCharacter(String(args[1]).split(','), String(args[2]), args[3] != null ? Number(args[3]) : null);
          break;
        case 'remove':
          SceneManager._scene.removeCharacter(String(args[1]).split(','), String(args[2]), args[3] != null ? Number(args[3]) : null);
          break;
        case 'end':
          SceneManager._scene.endChat();
          break;
      }
    }
    if (command === 'フェイスチャット' && SceneManager._scene.constructor.name == 'Scene_Map') {
      switch (args[0]) {
        case '開始':
          SceneManager._scene.startChat(String(args[1]).split(','), String(args[2]));
          break;
        case '会話':
          SceneManager._scene.talk(String(args[1]).split(','));
          break;
        case '表情':
          SceneManager._scene.emotion(String(args[1]).split(','), Number(args[2]), false);
          break;
        case '吹き出し':
        case 'ふきだし':
        case 'フキダシ':
          SceneManager._scene.balloon(String(args[1]).split(','), Number(args[2]));
          break;
        case 'モーション':
          SceneManager._scene.startAnim(String(args[1]).split(','), Number(args[2]));
          break;
        case '参加':
          SceneManager._scene.addCharacter(String(args[1]).split(','), String(args[2]), args[3] != null ? Number(args[3]) : null);
          break;
        case '退場':
          SceneManager._scene.removeCharacter(String(args[1]).split(','), String(args[2]), args[3] != null ? Number(args[3]) : null);
          break;
        case '終了':
          SceneManager._scene.endChat();
          break;
      }
    }
  };

  //-----------------------------------------------------------------------------
  // Sprite_ChatFace
  //
  // フェイスチャット用スプライトの定義です。

  function Sprite_ChatFace() {
    this.initialize.apply(this, arguments);
  }

  Sprite_ChatFace.prototype = Object.create(Sprite_Base.prototype);
  Sprite_ChatFace.prototype.constructor = Sprite_ChatFace;

  Sprite_ChatFace.prototype.initialize = function (pos, fileName) {
    Sprite_Base.prototype.initialize.call(this);
    this._position = pos;
    this._fileName = fileName;
    this._face = 1;
    this._mouseFrame = 0;
    this._eyeFrame = 0;
    this._talk = false;
    this._lastMouseFrame = mouseAnimFrame;
    this._lastEyeFrame = Math.floor(Math.random() * (eyeFrameMax - eyeFrameMin) + eyeFrameMin);
    this.bitmap = new Bitmap(faceSize, faceSize);
    if (fileName != null) {
      this._bitmap2 = ImageManager.loadPicture(this._fileName);
    }
    this.anchor.x = 0.5;
    this.anchor.y = 0.5;
    this._fadeOut = false;
  };

  Sprite_ChatFace.prototype.update = function () {
    Sprite.prototype.update.call(this);
    if (this.visible) {
      this.updateFrame();
      this.updateBalloon();
      //顔ベースの描画
      this.bitmap.blt(this._bitmap2, 0, faceSize * (this._face - 1), faceSize, faceSize, 0, 0);
      //目の描画
      this.bitmap.blt(this._bitmap2, faceSize * (this._eyeFrame + 1), faceSize * (this._face - 1), faceSize, faceSize, 0, 0);
      //口の描画
      this.bitmap.blt(this._bitmap2, faceSize * (eyeAnimNum + this._mouseFrame + 1), faceSize * (this._face - 1), faceSize, faceSize, 0, 0);
    }
  };

  Sprite_ChatFace.prototype.updateFrame = function () {
    //フェードイン
    if (this.opacity < 255 && !this._fadeOut) {
      //console.log("opacity : " + this.opacity);
      this.opacity += 25;
      if (this.opacity > 255) {
        this.opacity = 255;
      }
    }
    //フェードアウト
    if (this._fadeOut) {
      this.opacity -= 25;
      //console.log("opacity : " + this.opacity);
      if (this.opacity <= 0) {
        this.opacity = 0;
        this.visible = false;
        this._fadeOut = false;
      }
    }
    // 口パクの更新
    if (this._talk) {
      this._lastMouseFrame -= 1;
      if (this._lastMouseFrame == 0) {
        this._lastMouseFrame = mouseAnimFrame;
        this._mouseFrame += 1;
        if (this._mouseFrame == mouseAnimNum) {
          this._mouseFrame = 0;
        }
      }
    } else {
      this._mouseFrame = 0;
      this._lastMouseFrame = mouseAnimFrame;
    }
    //まばたきの更新
    //console.log("eye_frame_last : " + this._lastEyeFrame);
    this._lastEyeFrame -= 1;
    if (this._lastEyeFrame == 0) {
      this._eyeFrame += 1;
      if (this._eyeFrame == eyeAnimNum) {
        this._eyeFrame = 0;
      }
      if (this._eyeFrame == 0) {
        this._lastEyeFrame = Math.floor(Math.random() * (eyeFrameMax - eyeFrameMin) + eyeFrameMin);
      }
      else {
        this._lastEyeFrame = eyeAnimFrame;
      }
    }
  };

  Sprite_ChatFace.prototype.changeEmotion = function (num, motionFlag) {
    //顔グラフィックを取得
    this._face = num;
    if (motionFlag) {
      if (balloonNum[this._face - 1] != 0) {
        this.startBalloon(balloonNum[this._face - 1]);
      }
      if (animNum[this._face - 1] != 0) {
        this.startAnim(animNum[this._face - 1]);
      }
    }
  }

  Sprite_ChatFace.prototype.setTalk = function (talk) {
    this._talk = talk;
  }

  Sprite_ChatFace.prototype.setFace = function (fileName) {
    //顔グラフィックを取得
    this._face = 1;
    this._fileName = fileName;
    this._bitmap2 = ImageManager.loadPicture(fileName);
  }

  //吹き出しの表示
  Sprite_ChatFace.prototype.startBalloon = function (balloonNum) {
    if (!this._balloonSprite) {
      this._balloonSprite = new Sprite_Balloon();
    }
    this._balloonSprite.setup(balloonNum);
    this.parent.addChild(this._balloonSprite);
  };

  //吹き出しの更新
  Sprite_ChatFace.prototype.updateBalloon = function () {
    if (this._balloonSprite) {
      this._balloonSprite.x = this.x;
      this._balloonSprite.y = this.y - (faceSize / 2);
      if (!this._balloonSprite.isPlaying()) {
        this.endBalloon();
      }
    }
  };
  //吹き出しの終了
  Sprite_ChatFace.prototype.endBalloon = function () {
    if (this._balloonSprite) {
      this.parent.removeChild(this._balloonSprite);
      this._balloonSprite = null;
    }
  };

  //アニメーションの追加
  Sprite_ChatFace.prototype.startAnim = function (anim) {
    switch (anim) {
      case 1:
        //左右に揺れる
        this.addAnimation(new QueueTweenAnimation(new Point(0, 0), new Point(1.0, 1.0), 0.1, 10, CURVE_EASE_IN_OUT, DST_RELATIVE));
        this.addAnimation(new QueueTweenAnimation(new Point(0, 0), new Point(1.0, 1.0), -0.1, 10, CURVE_EASE_IN_OUT, DST_RELATIVE));
        this.addAnimation(new QueueTweenAnimation(new Point(0, 0), new Point(1.0, 1.0), 0, 10, CURVE_EASE_IN_OUT, DST_RELATIVE));
        break;
      case 2:
        //ぴょんぴょん
        this.addAnimation(new QueueTweenAnimation(new Point(0, -10), new Point(1.0, 1.0), 0, 5, CURVE_EASE_OUT, DST_RELATIVE));
        this.addAnimation(new QueueTweenAnimation(new Point(0, 10), new Point(1.0, 1.0), 0, 5, CURVE_EASE_IN, DST_RELATIVE));
        this.addAnimation(new QueueTweenAnimation(new Point(0, -10), new Point(1.0, 1.0), 0, 5, CURVE_EASE_OUT, DST_RELATIVE));
        this.addAnimation(new QueueTweenAnimation(new Point(0, 10), new Point(1.0, 1.0), 0, 5, CURVE_EASE_IN, DST_RELATIVE));
        break;
      case 3:
        //ガクッ
        this.addAnimation(new QueueTweenAnimation(new Point(10, 10), new Point(1.0, 1.0), 0.1, 5, CURVE_EASE_IN_OUT, DST_RELATIVE));
        this.addAnimation(new QueueTweenAnimation(new Point(0, 0), new Point(1.0, 1.0), 0.1, 60, CURVE_EASE_IN_OUT, DST_RELATIVE));
        this.addAnimation(new QueueTweenAnimation(new Point(-10, -10), new Point(1.0, 1.0), 0, 20, CURVE_EASE_IN_OUT, DST_RELATIVE));
        break;
      case 4:
        //びっくり
        this.addAnimation(new QueueTweenAnimation(new Point(0, 0), new Point(1.2, 1.2), 0, 5, CURVE_EASE_IN_OUT, DST_RELATIVE));
        this.addAnimation(new QueueTweenAnimation(new Point(0, 0), new Point(1.0, 1.0), 0, 5, CURVE_EASE_IN_OUT, DST_RELATIVE));
        this.addAnimation(new QueueTweenAnimation(new Point(0, 0), new Point(1.2, 1.2), 0, 5, CURVE_EASE_IN_OUT, DST_RELATIVE));
        this.addAnimation(new QueueTweenAnimation(new Point(0, 0), new Point(1.0, 1.0), 0, 5, CURVE_EASE_IN_OUT, DST_RELATIVE));
        break;
      case 5:
        //左右にゆらゆら
        this.addAnimation(new QueueTweenAnimation(new Point(10, 0), new Point(1.0, 1.0), 0, 5, CURVE_EASE_IN_OUT, DST_RELATIVE));
        this.addAnimation(new QueueTweenAnimation(new Point(-10, 0), new Point(1.0, 1.0), 0, 5, CURVE_EASE_IN_OUT, DST_RELATIVE));
        this.addAnimation(new QueueTweenAnimation(new Point(10, 0), new Point(1.0, 1.0), 0, 5, CURVE_EASE_IN_OUT, DST_RELATIVE));
        this.addAnimation(new QueueTweenAnimation(new Point(-10, 0), new Point(1.0, 1.0), 0, 5, CURVE_EASE_IN_OUT, DST_RELATIVE));
        break;
      case 6:
        //ドンッとアップ
        this.addAnimation(new QueueTweenAnimation(new Point(0, 0), new Point(1.2, 1.2), 0, 5, CURVE_EASE_IN_OUT, DST_RELATIVE));
        this.addAnimation(new QueueTweenAnimation(new Point(0, 0), new Point(1.2, 1.2), 0, 30, CURVE_EASE_IN_OUT, DST_RELATIVE));
        this.addAnimation(new QueueTweenAnimation(new Point(0, 0), new Point(1.0, 1.0), 0, 30, CURVE_EASE_IN_OUT, DST_RELATIVE));
        break;
    }
  };

  //-----------------------------------------------------------------------------
  // Scene_Map
  //
  // マップシーンの定義です。
  Scene_Map.prototype.startChat = function (characters, title) {
    this._spriteset.startChat(characters);
    if (!this._chatTitleWindow) {
      this._chatTitleWindow = new Window_Base(0, 0, Graphics.boxWidth, 80);
      this._chatTitleWindow.setBackgroundType(1);
      this.addWindow(this._chatTitleWindow);
      this._chatTitleWindow.close();
    }
    if (title != "undefined") {
      this._chatTitleWindow.contents.clear();
      this._chatTitleWindow.drawText(title, 0, 4, Graphics.boxWidth, "center");
      this._chatTitleWindow.open();
    }
    this._isStarted = true;
  };

  Scene_Map.prototype.talk = function (characters) {
    this._spriteset.talk(characters);
  };

  Scene_Map.prototype.emotion = function (characters, emotion, motionFlag) {
    this._spriteset.emotion(characters, emotion, motionFlag);
  };

  Scene_Map.prototype.balloon = function (characters, balloon) {
    this._spriteset.balloon(characters, balloon);
  };

  Scene_Map.prototype.startAnim = function (characters, anim) {
    this._spriteset.startAnim(characters, anim);
  };

  Scene_Map.prototype.addCharacter = function (characters, direction, frame) {
    this._spriteset.addCharacter(characters, direction, frame);
  };
  Scene_Map.prototype.removeCharacter = function (characters, direction, frame) {
    this._spriteset.removeCharacter(characters, direction, frame);
  };

  Scene_Map.prototype.endChat = function () {
    this._spriteset.endChat();
    this._chatTitleWindow.close();
    this._isStarted = false;
  };

  Scene_Map.prototype.isStartedChat = function () {
    if (this._isStarted == null) {
      return false;
    }
    return this._isStarted;
  };

  Scene_Map.prototype.joinedCharacterInChat = function (character) {
    if (!this.isStartedChat()) {
      return false;
    }
    return this._spriteset.joinedCharacterInChat(character);
  };

  //-----------------------------------------------------------------------------
  // Spriteset_Map
  //

  var createUpper = Spriteset_Map.prototype.createUpperLayer;
  Spriteset_Map.prototype.createUpperLayer = function () {
    this._faces = [];
    this._characters = [];
    for (i = 0; i < 8; i++) {
      var sprite = new Sprite_ChatFace(i + 1, null);
      sprite.x = i * 50;
      sprite.y = 0;
      sprite.opacity = 0;
      sprite.visible = false;
      this.addChild(sprite);
      this._faces.push(sprite);
    }

    createUpper.call(this);
  }

  Spriteset_Map.prototype.startChat = function (characters) {
    //console.log(characters);
    this._characters = characters;
    for (i = 0; i < characters.length; i++) {
      var sprite = this._faces[i];
      sprite.visible = true;
      sprite.setFace(characters[i]);
      this.setPos(sprite, i + 1);
    }
  };

  Spriteset_Map.prototype.setPos = function (sprite, id) {
    sprite.move(this.getPosX(id, this._characters.length), this.getPosY(id, this._characters.length));
  };

  Spriteset_Map.prototype.getPosX = function (id, max) {
    width = faceSize + margin;
    posIndex = 0;
    column = 0;

    if (id < 5) {
      posIndex = 2 - (id % 2);
    } else {
      posIndex = Math.floor((id + 1) / 2);
    }
    if (max < 5) {
      column = Math.min(max, 2) - ((max === 3 && id === 3) ? 1 : 0);
    } else {
      column = Math.floor((max + 1) / 2);
      if (max % 2 === 1) {
        if (id < 5) {
          if (id >= 3) {
            column -= 1;
          }
        } else {
          if (id % 2 === 0) {
            column -= 1;
          }
        }
      }
    }
    console.log("id : " + id + ", posIndex : " + posIndex + " column : " + column);
    origin = Math.floor((Graphics.boxWidth - (width * (column - 1))) / 2);
    return origin + (width * (posIndex - 1));
  };

  Spriteset_Map.prototype.getPosY = function (id, max) {
    height = faceSize + margin;
    posIndex = 0;
    row = 0;

    if (id < 5) {
      posIndex = Math.floor((id + 1) / 2);
    } else {
      posIndex = 2 - (id % 2);
    }
    if (max < 5) {
      row = Math.floor((max + 1) / 2);
    } else {
      row = 2;
    }
    console.log("id : " + id + ", posIndex : " + posIndex + ", row : " + row);
    origin = Math.floor((Graphics.boxHeight - windowHeight - (height * (row - 1))) / 2);
    return origin + 48 + (height * (posIndex - 1));
  };

  Spriteset_Map.prototype.endChat = function () {
    this._characters = [];
    for (i = 0; i < 8; i++) {
      var sprite = this._faces[i];
      if (sprite.visible) {
        sprite._fadeOut = true;
        sprite.endBalloon();
        sprite.deleteAllAnimations();
      }
    }
  };
  Spriteset_Map.prototype.talk = function (characters) {
    //console.log(characters);
    //全解除
    for (i = 0; i < 8; i++) {
      this._faces[i].setTalk(false);
    }
    //設定
    for (i = 0; i < characters.length; i++) {
      var index = this._characters.indexOf(characters[i]);
      if (index != -1) {
        this._faces[index].setTalk(true);
      }
    }
  };


  Spriteset_Map.prototype.emotion = function (characters, emotion, motionFlag) {
    for (i = 0; i < characters.length; i++) {
      var index = this._characters.indexOf(characters[i]);
      if (index != -1) {
        this._faces[index].changeEmotion(emotion, motionFlag);
      }
    }
  };
  Spriteset_Map.prototype.balloon = function (characters, balloon) {
    for (i = 0; i < characters.length; i++) {
      var index = this._characters.indexOf(characters[i]);
      if (index != -1) {
        this._faces[index].startBalloon(balloon);
      }
    }
  };

  Spriteset_Map.prototype.startAnim = function (characters, animId) {
    for (i = 0; i < characters.length; i++) {
      var index = this._characters.indexOf(characters[i]);
      if (index != -1) {
        this._faces[index].startAnim(animId);
      }
    }
  };

  Spriteset_Map.prototype.addCharacter = function (characters, direction, frame) {
    isRight = !(direction.toUpperCase() == 'LEFT' || direction == '左');
    //console.log(characters);
    //this._characters = characters;
    prevLength = this._characters.length;
    addCount = Math.min(characters.length, 8 - prevLength);
    for (i = 0; i < addCount; i++) {

      var sprite;// = this._faces[prevLength + i];
      var index;
      if (isRight) {
        index = i;
        sprite = this._faces[prevLength + i];
        sprite.move(this.getPosX(prevLength + index + 1, Math.min(prevLength + characters.length, 8)) + (Graphics.boxWidth),
          this.getPosY(prevLength + index + 1, Math.min(prevLength + characters.length, 8)));
        this._characters.push(characters[index]);
      } else {
        //左からの入場時は配列の先頭に挿入
        index = addCount - i - 1;
        sprite = this._faces[7];
        this._faces.pop();
        this._faces.unshift(sprite);
        sprite.move(this.getPosX(index + 1, Math.min(prevLength + characters.length, 8)) + (Graphics.boxWidth * -1),
          this.getPosY(index + 1, Math.min(prevLength + characters.length, 8)));
        this._characters.unshift(characters[index]);
      }
      sprite.setFace(characters[index]);
      sprite.visible = true;

    }

    for (i = 0; i < this._characters.length; i++) {
      this._faces[i].deleteAllAnimations();
      this._faces[i].addAnimation(new QueueTweenAnimation(new Point(this.getPosX(i + 1, this._characters.length), this.getPosY(i + 1, this._characters.length)),
        new Point(1.0, 1.0),
        0,
        (frame != null) ? frame : 60 * 2,
        UNIFORM,
        DST_ABSOLUTE));
    }
  };

  Spriteset_Map.prototype.removeCharacter = function (characters, direction, frame) {
    isRight = (direction.toUpperCase() == 'RIGHT' || direction == '右');

    for (i = 0; i < characters.length; i++) {
      var index = this._characters.indexOf(characters[i]);
      if (index == -1) {
        continue;
      }
      var sprite = this._faces[index];
      console.log(characters[i] + ", " + index);
      //1:退場するキャラクターを配列の最後尾に移す
      this._faces.splice(index, 1);
      this._faces.push(sprite);
      //2:退場するキャラクターをthis._charactersから除外
      this._characters.splice(index, 1);
      //3:配列の最後尾に移動したキャラを画面外へ移動
      sprite.addAnimation(new QueueTweenAnimation(new Point(Graphics.boxWidth * (isRight ? 1 : -1), 0),
        new Point(1.0, 1.0),
        0,
        60 * 2,
        UNIFORM,
        DST_RELATIVE));
    }
    //4:残ったキャラの位置移動
    for (i = 0; i < this._characters.length; i++) {
      this._faces[i].deleteAllAnimations();
      this._faces[i].addAnimation(new QueueTweenAnimation(new Point(this.getPosX(i + 1, this._characters.length), this.getPosY(i + 1, this._characters.length)),
        new Point(1.0, 1.0),
        0,
        (frame != null) ? frame : 60 * 2,
        UNIFORM,
        DST_ABSOLUTE));
    }
  };
  Spriteset_Map.prototype.joinedCharacterInChat = function (character) {
    if (this._characters == null) {
      return false;
    }
    return this._characters.indexOf(character) != -1;
  };

  // Show Text
  var showText = Game_Interpreter.prototype.command101
  Game_Interpreter.prototype.command101 = function () {
    if (SceneManager._scene.constructor.name == 'Scene_Map' && SceneManager._scene.isStartedChat() && SceneManager._scene.joinedCharacterInChat(this._params[0])) {
      var arr = [this._params[0]];
      SceneManager._scene.talk(arr);
      SceneManager._scene.emotion(arr, Number(this._params[1]) + 1, true);
    }
    showText.call(this);
  }

  Game_Message.prototype.setFaceImage = function (faceName, faceIndex) {
    if (faceName) {
      if (!SceneManager._scene.constructor.name == 'Scene_Map' || !SceneManager._scene.joinedCharacterInChat(faceName)) {
        this._faceName = faceName;
        this._faceIndex = faceIndex;
      }
    } else {
      this._faceName = faceName;
      this._faceIndex = faceIndex;
    }
  };

})();