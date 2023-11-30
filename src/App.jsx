import { useEffect, useState,useRef } from 'react'
import {Box,Button,Container,HStack,Input,VStack} from "@chakra-ui/react"
import Message from './components/Message'
import {
  onAuthStateChanged,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth"
import {app} from "./firebase"
import { 
  addDoc, 
  getFirestore, 
  collection, 
  serverTimestamp,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore"

const auth=getAuth(app)
const db=getFirestore(app)

const logoutHandler=()=>
   signOut(auth)


const loginHandler=()=>{
  const provider= new GoogleAuthProvider();

  signInWithPopup(auth,provider)
}



function App() {
  const [user,setUser]=useState(false)
  const [message,setMessage]=useState("")
  const [messages,setMessages]=useState([])
  const divForScroll=useRef(null)
 
  useEffect(() => {
    const q=query(collection(db,"Messages"),orderBy("createdAt","asc"))
   const unsubscribe=onAuthStateChanged(auth,(data)=>{
   setUser(data);
   })

   const unsubscribeForMessages=onSnapshot(q,(snap)=>{
    setMessages(snap.docs.map(item=>{
      const id = item.id;
      return {id, ...item.data()}
    }))

   })

  
   return ()=>{
    unsubscribe();
    unsubscribeForMessages();
   }
  }, [])

  const submitHandler=async(e)=>{
    e.preventDefault();
    try {
      await addDoc(collection(db,"Messages"),{
        text:message,
        uid:user.uid,
        uri:user.photoURL,
        createdAt:serverTimestamp()
      });
      setMessage("");
      divForScroll.current.scrollIntoView({behavior:"smooth"});
    } catch (error) {
      alert(error)
    }
  
  }
  


  return (
    <Box bg={"red.50"}>
    {user?
      <Container bg={"white"} h={"100vh"}>
      <VStack h={"full"} padding={"6"}>
        <Button onClick={logoutHandler} colorScheme={"red"} w={"full"}>Logout</Button>


        <VStack h={"full"} w={"full"} overflowY={"auto"} css={{"&::-webkit-scrollbar":{display:"none"}}}>
        {
          messages.map(item=>(
            <Message 
            key={item.id}
            text={item.text} 
            uri={item.uri}
            user={item.uid===user.uid?"me":"other"}
          />))
        }
        

        <div ref={divForScroll}></div>
        </VStack>

        

        <form onSubmit={submitHandler} style={{width:"100%"}}>
        <HStack>
        <Input value={message} onChange={(e)=>setMessage(e.target.value)} placeholder='Enter your message...'/>
          <Button colorScheme={"purple"} type='submit'>Send</Button>
        </HStack>
          
        </form>
      </VStack>
      </Container>
    :
    <VStack bg={"white"}
    justifyContent={"center"} 
    h={"100vh"}>
    <Button onClick={loginHandler} 
    colorScheme={"purple"}>Sign in with google</Button>
    </VStack>}
      
    </Box>
  )
}

export default App
