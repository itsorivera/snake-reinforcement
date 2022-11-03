// instances canvas, snake, apple and canvasContext
const canvas = document.getElementById('canvas')

const canvasContext = canvas.getContext('2d');

let gameSpeed = 10
//connect to canvas using 'gameSpeed'
let gameSpeedElement = document.getElementById('gameSpeed')

// connect to canvas using 'highScore'
let highScore = 0 
let highScoreElement = document.getElementById('highScore')

let averageScore = 0
let averageScoreElement = document.getElementById('averageScore')

let epochNumber = 0
let epochNumberElement = document.getElementById('epochNumber')

let appleEated = false
let size = 20
let gameInterval

gameSpeedElement.addEventListener('change', () =>{
    gameSpeed = parseInt(gameSpeedElement.value)
    console.log(gameSpeed)
    clearInterval(gameInterval)
    gameLoop()
})

//work game
window.onload = () => {
    gameLoop();
}

function gameLoop(){
    gameInterval = setInterval(show, 1000/gameSpeed) // fps
}

function show(){
    update();
    draw();
}

//update each lopp
function update(){
    canvasContext.clearRect(0,0, canvas.width, canvas.height)
    console.log('update buddy')

    snake.move();
    eatApple();
    rlSnake.update();
    checkCollision();
    appleEated = false
    
}

function gameOver(){
    highScore = Math.max(highScore, snake.tail.length - 1)
    highScoreElement.textContent = highScore
    epochNumberElement.textContent = epochNumber++
    averageScoreElement.textContent = (parseInt(averageScoreElement.textContent) * epochNumber + snake.tail.length - 1) / epochNumber;

    snake.initVars()
}


function checkCollision(){
    let headTail = snake.tail[snake.tail.length - 1]

    //wall collision
    if( headTail.x <= -snake.size || headTail.x >= canvas.width ||
        headTail.y <= -snake.size || headTail.y >= canvas.height){
            gameOver()
            return
        }
    
    //self collision
    for(let i=0; i<snake.tail.length - 2; i++){
        if(headTail.x == snake.tail[i].x && headTail.y == snake.tail[i].y){
            gameOver()
            return
        }
    }

    /* appear up down left and right
    if(headTail.x == - snake.size){
        headTail.x = canvas.width - snake.size
    }else if(headTail.x == canvas.width){
        headTail.x = 0
    }else if(headTail.y == - snake.size){
        headTail.y = canvas.height - snake.size
    }else if(headTail.y == canvas.height){
        headTail.y = 0
    }*/
}


function eatApple(){
    if(snake.tail[snake.tail.length - 1].x == apple.x && snake.tail[snake.tail.length - 1].y == apple.y){
        snake.tail[snake.tail.length] = {x:apple.x, y: apple.y}
        apple = new Apple();  
        appleEated = true      
    }
}

//show in canvas
function draw(){
    createRect(0,0,canvas.width, canvas.height, 'green')
    createRect(0,0,canvas.width, canvas.height)
    for(var i=0; i<snake.tail.length; i++){
        createRect(snake.tail[i].x + 2.5, snake.tail[i].y + 2.5, snake.size - 5, snake.size - 5, 'white')
    }

    canvasContext.font = '20px Arial'
    canvasContext.fillStyle = '#00FF42'
    canvasContext.fillText('Score: ' + (snake.tail.length - 1), canvas.width - 120, 18);
    //show apple
    createRect(apple.x, apple.y, apple.size, apple.size, apple.color)
}


//create object in canvas
function createRect(x,y,width,height, color){
    canvasContext.fillStyle = color
    canvasContext.fillRect(x,y,width,height)
}


//move with keyboards
window.addEventListener('keydown', (event)=>{
    setTimeout(()=>{
        if(event.keyCode == 37 && snake.rotateX != 1){
            snake.rotateX = -1
            snake.rotateY = 0
        }else if(event.keyCode == 38 && snake.rotateY != 1){
            snake.rotateX = 0
            snake.rotateY = -1
        }else if(event.keyCode == 39 && snake.rotateX != -1){
            snake.rotateX = 1
            snake.rotateY = 0
        }else if(event.keyCode == 40 && snake.rotateY != -1){
            snake.rotateX = 0
            snake.rotateY = 1
        }
    }, 1)
})




/** C  L   A   S   S   E   S**/

class RLSnake{

    constructor(){
        this.alpha = 0.2
        this.gamma = 0.2
        this.noEatLoopCount = 0
        this.maxNoEatLoopCount = 500
        this.isAheadClearIndex = 0
        this.isLeftClearIndex = 1
        this.isRightClearIndex = 2
        this.isAppleAheadIndex = 3
        this.isAppleLeftIndex = 4
        this.isAppleRightIndex = 5
        this.initialState = [1,1,1,0,0,0]//action?
        this.state = this.initialState
        this.Q_table = {}
    }

    calculateState(){
        this.state = this.initialState.slice()
        this.checkDirections()
    }

    update(){
        this.reward(this.state, this.getAction(this.state))
        this.checkDirections()

        let action = this.getAction(this.state)
        this.implementAction(action)
        //console.log(this.Q_table)
    }

    reward(state, action){
        let rewardForState = 0
        this.calculateState()
        let futureState = this.state

        let stringifiedCurrentState = JSON.stringify(state)
        let stringifiedFutureState = JSON.stringify(futureState)

        if(stringifiedCurrentState != stringifiedFutureState){
            if( (state[0] == 0 && action == 0) ||
                (state[1] == 0 && action == 1) ||
                (state[1] == 0 && action == 2)){
                    rewardForState -= 1
                }
            
            if( (state[this.isAheadClearIndex] == 1 && action == 0 && state[this.isAppleAheadIndex] == 1) ||
                (state[this.isLeftClearIndex] == 1 && action == 1 && state[this.isAppleLeftIndex] == 1) ||
                (state[this.isRightClearIndex] == 1 && action == 2 && state[this.isAppleRightIndex] == 1)){
                    rewardForState += 1
                }
        }
        let optimumFutureValue = Math.max(
            this.getQ(futureState, 0),
            this.getQ(futureState, 1),
            this.getQ(futureState, 2)
        )

        let updateValue = this.alpha * 
                            (rewardForState + 
                                this.gamma * optimumFutureValue -
                                this.getQ(state, action)) -
                            0.0001;
        
        this.setQ(state, action, updateValue)
        
                
    }

    implementAction(action){
        if(typeof action === 'undefined') return
        if(!action) return
        if(action == 0) return

        let isRight = action == 2 ? -1 : 1

        if(snake.rotateX == 1){
            snake.rotateY = -1 * isRight
            snake.rotateX = 0
        }else if(snake.rotateX == -1){
            snake.rotateY = 1 * isRight
            snake.rotateX = 0
        }else if(snake.rotateY == 1){
            snake.rotateX = 1 * isRight
            snake.rotateY = 0
        }else if(snake.rotateY == -1){
            snake.rotateX = -1 * isRight
            snake.rotateY = 0
        }
    } 

    getQ(state, action){
        let config = state.slice()
        config.push(action)
        if(!(config in this.Q_table)){
            return 0
        }
        return this.Q_table[config]
    }

    setQ(state, action, reward){
        let config = state.slice()
        config.push(action)
        if(!(config in this.Q_table)){
            this.Q_table[config] = 0
        }
        this.Q_table[config] += reward
        console.log(this.Q_table)
    }

    getAction(state){
        let q = {}
        for(let l=0; l<3; l++){
            q[l] = this.getQ(state, l)
        }

        let items = Object.keys(q).map( (key) => {
            return [key, q[key]]
        })

        items.sort((first, second) => {
            return second[1] - first[1]
        })

        q = items

        if(!appleEated){
            this.noEatLoopCount++
        }

        if(this.noEatLoopCount > this.maxNoEatLoopCount){
            this.noEatLoopCount = 0
            gameOver()
            return
        }
        
        let key = Object.entries(q).sort((x, y) => y[1] - x[1])[0]
        return parseInt(key[1][0])
    }

    checkDirections(){
        let correspondingSize
        let headTail = snake.tail[snake.tail.length - 1]
        let rx = snake.rotateX
        let ry = snake.rotateY

        //wall
        if( (ry == 1 && headTail.x == 0) || (rx == 1 && headTail.y + size == canvas.height) ||  
            (ry == -1 && headTail.x + size == canvas.width) || (rx == -1 && headTail.y == 0)){
                this.state[this.isRightClearIndex] = 0
        }

        
        if( (ry == 1 && headTail.y + size == canvas.height) || (rx == 1 && headTail.x + size == canvas.width) ||  
            (ry == -1 && headTail.y == 0) || (rx == -1 && headTail.x == 0)){
                this.state[this.isAheadClearIndex] = 0
        }
        
            
        if( (ry == 1 && headTail.x + size == canvas.width) || (rx == 1 && headTail.y == 0) || 
            (ry == -1 && headTail.x == 0) || (rx == -1 && headTail.y + size == canvas.height)){
            this.state[this.isLeftClearIndex] = 0
        }

        for(let i=0; i<snake.tail.length - 2; i++){
            let ithTail = snake.tail[i]
            if( rx == 0 && headTail.y == ithTail.y){
                correspondingSize = ry == 1 ? -size: size
                if( headTail.x = ithTail.x + correspondingSize){
                    this.state[this.isLeftClearIndex] = 0
                }
                if( headTail.x == ithTail.x - correspondingSize){
                    this.state[this.isRightClearIndex] = 0
                }
            }else if( ry == 0 && headTail.x == ithTail.x){
                correspondingSize = rx == 1 ? -size: size
                if( headTail.y = ithTail.y + correspondingSize){
                    this.state[this.isRightClearIndex] = 0
                }
                if( headTail.y == ithTail.y - correspondingSize){
                    this.state[this.isLeftClearIndex] = 0
                }
            }

            if( rx == 0 && headTail.x == ithTail.x && headTail.y + ry * size == ithTail.y){
                this.state[this.isAheadClearIndex = 0]   
            }
            
            if( ry == 0 && headTail.y == ithTail.y && headTail.x + ry * size == ithTail.x){
                this.state[this.isAheadClearIndex = 0]
            }    
        }

        if(headTail.x == apple.x && ry != 0){
            if(ry == 1 && headTail.y < apple.y)
                this.state[this.isAppleAheadIndex] = 1
            if(ry == -1 && headTail.y > apple.y)
                this.state[this.isAppleAheadIndex] = 1
        }else if(headTail.y == apple.y && rx != 0){
            if(rx == 1 && headTail.x < apple.x)
                this.state[this.isAppleAheadIndex] = 1
            if(rx == -1 && headTail.x > apple.x)
                this.state[this.isAppleAheadIndex] = 1
        }else{
            let index =-1
            if(ry == 1 && apple.x > headTail.x){
                index = this.isAppleLeftIndex
            }else if( ry == 1 && apple.x < headTail.x){
                index = this.isAppleRightIndex
            }

            if(ry == -1 && apple.x > headTail.x){
                index = this.isAppleRightIndex
            }else if( ry == -1 && apple.x < headTail.x){
                index = this.isAppleLeftIndex
            }

            if(rx == 1 && apple.y > headTail.y){
                index = this.isAppleRightIndex
            }else if( rx == 1 && apple.y < headTail.y){
                index = this.isAppleLeftIndex
            }

            if(rx == -1 && apple.y > headTail.y){
                index = this.isAppleLeftIndex
            }else if( rx == -1 && apple.y < headTail.y){
                index = this.isAppleRightIndex
            }

            if(index != -1) this.state[index] = 1


        }
    }
}

class Snake{

    constructor(){
        this.initVars();
    }

    initVars(){
        this.x = 20;
        this.y = 20;
        this.size = 20;
        this.tail = [{x: this.x, y: this.y}];
        this.rotateX = 0;
        this.rotateY = 1;
    }

    move(){
        let newRect;
        if(this.rotateX == 1){
            newRect = {
                x: this.tail[this.tail.length - 1].x + this.size,
                y: this.tail[this.tail.length - 1].y
            }
        }else if(this.rotateX == - 1){
            newRect = {
                x: this.tail[this.tail.length - 1].x - this.size,
                y: this.tail[this.tail.length - 1].y
            }
        }else if(this.rotateY == 1){
            newRect = {
                x: this.tail[this.tail.length - 1].x,
                y: this.tail[this.tail.length - 1].y + this.size
            }
        }
        else if(this.rotateY == -1){
            newRect = {
                x: this.tail[this.tail.length - 1].x,
                y: this.tail[this.tail.length - 1].y - this.size
            }
        }

        this.tail.shift()
        this.tail.push(newRect)

    }
}


class Apple{
    constructor(){
        console.log('apple')
        let isTouching;
        while(true){
            isTouching = false;
            this.x = Math.floor(Math.random() * canvas.width / snake.size) * snake.size
            this.y = Math.floor(Math.random() * canvas.height / snake.size) * snake.size
            for(let i=0; i<snake.tail.length; i++){
                if(this.x == snake.tail[i].x && this.y == snake.tail[i].y){
                    isTouching = true
                }
            }
            if(!isTouching){
                break;
            }
            
        }
        this.color = 'red'
        this.size = snake.size
        console.log(this.x, this.y)
    }
}


const snake = new Snake()
let apple = new Apple()
let rlSnake = new RLSnake()