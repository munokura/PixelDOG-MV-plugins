//=============================================================================
// PD_AdjustCharaSprite.js
// ----------------------------------------------------------------------------
// (C)2015 PixelDOG
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//=============================================================================
/*:
@plugindesc Automatically reduces the character's display size on the world map and slows down their movement speed.
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
Character chips with the file name "noAdjust" will not be scaled down.
Walking graphics with the file name ending in "_F" will be treated as field
graphics.
This graphic change can be used in conjunction with
PD_8DirDash.js.

Last update: 2015/12/18 v1.01
*/


/*:ja
@plugindesc ワールドマップで自動的にキャラクターの表示サイズを小さくし、移動速度を下げます。
@author しおいぬ

@help
ファイル名に「noAdjust」が含まれるキャラクターチップは縮小されません。
ファイル名の末尾に「_F」の文字列が含まれる歩行グラフィックを
フィールドグラフィックとして扱います。
このグラフィック変更はPD_8DirDash.jsと併用可能です。

last update : 2015/12/18 v1.01
*/

(function(){

    Sprite_Character.prototype.updateOther = function() {
        this.opacity = this._character.opacity();
        this.blendMode = this._character.blendMode();
        this._bushDepth = this._character.bushDepth();

        var fileName = this._characterName.substring(this._characterName.lastIndexOf( "_" ));
        if($gameMap.isOverworld() && this._characterName.indexOf("noAdjust") === -1 && this._tileId === 0 && (fileName.indexOf("F") === -1)){
            this.scale = new Point(0.5, 0.5);
        }
        else {
            this.scale = new Point(1, 1);
        }
    };

    Sprite_Character.prototype.characterPatternX = function() {
        var fileName = this._characterName.substring(this._characterName.lastIndexOf( "_" ));
        if($gameMap.isOverworld() && (fileName.indexOf("F") != -1)){
            if(fileName.indexOf("D") != -1){
                return this.shiftCharacterPatternX(6);
            } else {
                return this.shiftCharacterPatternX(3);
            }
        }
        return this.shiftCharacterPatternX(0);
    };

    var shiftPatternX = Sprite_Character.prototype.shiftCharacterPatternX;
    Sprite_Character.prototype.shiftCharacterPatternX = function(shift) {
        if(!shiftPatternX){
            return this._character.pattern() + shift;
        }
        return shiftPatternX.call(this, shift);
    };

    Game_Player.prototype.realMoveSpeed = function() {
        return this._moveSpeed + (this.isDashing() ? 1 : 0) - ($gameMap.isOverworld() ? 1 : 0);
    };

})();