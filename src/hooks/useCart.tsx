import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  // metodo para verificar se cart foi alterado de
  // se alterado, atulizar localStorage com setItem
  //***
  // const prevCart = useRef<Product[]>();
  // useEffect(() => {
  //   prevCart.current = cart;
  // })
  // const cartPreviousValue = prevCart.current ?? cart;
  // useEffect(() => {
  //   if(cartPreviousValue !== cart) {
  //     localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
  //   }
  // }, [cart, cartPreviousValue])


  const addProduct = async (productId: number) => {
    try {
      const updateCart = [...cart];
      const productExist = updateCart.find(product => product.id === productId);
      const stokAtual = await api.get(`stock/${productId}`);
      const stockAmount = stokAtual.data.amount;
      const currentAmout = productExist ? productExist.amount : 0
      const amount = currentAmout + 1;

      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      } 
      
      if(productExist){ 
        productExist.amount = amount; 
      }else{
        const product = await api.get(`products/${productId}`)
        const newProduct = {...product.data, amount: 1}
        updateCart.push(newProduct);
      } 
      setCart(updateCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart))
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updateCart = [...cart];
      const productIndex = updateCart.findIndex(product => product.id === productId);

      if(productIndex >= 0){
        updateCart.splice(productIndex, 1);
        setCart(updateCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart))
      }else{
        throw new Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0){
        return;
      }
      const updateCart = [...cart];
      const productExists = updateCart.find(product => product.id === productId);
      const stokAtual = await api.get(`stock/${productId}`);
      const stockAmount = stokAtual.data.amount;

      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(productExists){
        productExists.amount = amount;
        setCart(updateCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart))
      }else{
        throw Error();
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
