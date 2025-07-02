
"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getProducts, updateProduct } from "@/lib/data";
import type { Product } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Image as ImageIcon, Edit, Camera, FileImage } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ManageProductImagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);


  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!['developer', 'shop-owner', 'imager'].includes(user.role)) {
      router.push("/");
      return;
    }

    getProducts().then(data => {
      setProducts(data);
      setLoading(false);
    }).catch(err => {
        console.error("Failed to load products", err);
        setLoading(false);
    });
  }, [user, router]);
  
  // Effect to handle camera stream
  useEffect(() => {
    const getCameraPermission = async () => {
      // If the dialog is not open or camera view is not requested, stop any existing streams
      if (!editingProduct || !showCamera) {
        if (videoRef.current?.srcObject) {
           (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
        return;
      }
      
      // Request camera permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    };
    getCameraPermission();

    // Cleanup function to stop stream when component unmounts or dependencies change
    return () => {
       if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    }
  }, [editingProduct, showCamera, toast]);


  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleImageClick = (product: Product) => {
    setEditingProduct(product);
  }

  const handleUpdateImage = async (newImageSrc: string) => {
    if (!editingProduct) return;
    setIsUpdating(true);

    const otherImages = editingProduct.images.slice(1);
    const updatedImages = [newImageSrc, ...otherImages];

    const updatedProductData: Product = {
      ...editingProduct,
      images: updatedImages,
      imageUpdatedAt: new Date().toISOString(),
    };

    try {
        await updateProduct(updatedProductData);
        
        setProducts(currentProducts => 
            currentProducts.map(p => 
                p.id === editingProduct.id ? updatedProductData : p
            )
        );

        toast({ title: "Image Updated", description: `The image for ${editingProduct.name} has been changed.` });
    } catch (error) {
        console.error("Failed to update image", error);
        toast({ title: "Update Failed", description: "Could not save the new image.", variant: "destructive" });
    } finally {
        setIsUpdating(false);
        setEditingProduct(null);
        setShowCamera(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage = e.target?.result as string;
        handleUpdateImage(newImage);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && hasCameraPermission) {
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const newImage = canvas.toDataURL('image/png');
        handleUpdateImage(newImage);
      }
    }
  };

  const ProductImageSkeleton = () => (
      <Card>
          <CardContent className="p-4 grid grid-cols-3 gap-4 items-center">
              <div className="col-span-2 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-3/4 mt-2" />
              </div>
              <div className="col-span-1">
                  <Skeleton className="w-full aspect-square rounded-md" />
              </div>
          </CardContent>
      </Card>
  )

  if (!user || !['developer', 'shop-owner', 'imager'].includes(user.role)) {
    return <div className="container py-12 text-center">Redirecting...</div>;
  }

  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="h-6 w-6" />
            Image Lab
        </h1>
        <Input 
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <ProductImageSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(p => (
            <Card key={p.id}>
                <CardContent className="p-4 grid grid-cols-3 gap-4 items-center">
                    <div className="col-span-2">
                        <p className="font-semibold leading-tight">{p.name}</p>
                        <p className="text-sm text-muted-foreground">{p.itemCode}</p>
                         <p className="text-xs text-muted-foreground mt-4">Click image to change.</p>
                    </div>
                    <div className="col-span-1">
                        <div 
                            className="w-full aspect-square rounded-md relative overflow-hidden border cursor-pointer group"
                            onClick={() => handleImageClick(p)}
                        >
                            <Image 
                                src={p.images[0] || 'https://placehold.co/400x400.png'}
                                alt={p.name}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                                data-ai-hint={p.dataAiHint}
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Edit className="h-8 w-8 text-white" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editingProduct} onOpenChange={(open) => { if (!open) { setEditingProduct(null); setShowCamera(false); } }}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Update Image for {editingProduct?.name}</DialogTitle>
                <DialogDescription>Choose a new primary image by uploading or using your camera.</DialogDescription>
            </DialogHeader>

            <Input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} ref={fileInputRef} />
            <canvas ref={canvasRef} className="hidden" />

            {showCamera ? (
                <div className="space-y-2">
                    <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                    {hasCameraPermission === false && (
                        <Alert variant="destructive">
                            <AlertTitle>Camera Access Required</AlertTitle>
                            <AlertDescription>Please allow camera access to use this feature.</AlertDescription>
                        </Alert>
                    )}
                    <div className="flex gap-2">
                        <Button onClick={handleCapture} disabled={!hasCameraPermission || isUpdating} className="w-full">
                            {isUpdating ? "Saving..." : "Capture Photo"}
                        </Button>
                        <Button variant="outline" onClick={() => setShowCamera(false)} className="w-full" disabled={isUpdating}>Cancel</Button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row gap-4 py-4">
                    <Button asChild variant="outline" className="w-full h-24 text-lg" disabled={isUpdating}>
                        <Label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                            <FileImage className="h-8 w-8" />
                            Upload File
                        </Label>
                    </Button>
                    <Button onClick={() => setShowCamera(true)} variant="outline" className="w-full h-24 text-lg flex-col gap-2" disabled={isUpdating}>
                        <Camera className="h-8 w-8" />
                        Use Camera
                    </Button>
                </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
