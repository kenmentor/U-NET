import torch
import torch.nn as nn 
import torch.nn.functional as TF 
# import dataset
class DoubleConv(nn.Module):
    def __init__ (self,in_channels=3,out_channels=1):
        super(DoubleConv,self).__init__()
        
        self.conv = nn.Sequential(
            nn.Conv2d(in_channels,out_channels,kernel_size=3,stride=1,padding=1,bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
             nn.Conv2d(out_channels,out_channels,kernel_size=3,stride=1,padding=1,bias=False),
                       nn.BatchNorm2d(out_channels),
                       nn.ReLU(inplace=True)
            
            
        
        )
    def forward(self,x):
        return self.conv(x)
    
class UNET(nn.Module):
    def __init__(self, in_channels: int = 3, out_channel: int = 1):
        super().__init__()
        self.features = [64,128,256,512]
        self.up =nn.ModuleList()
        self.down =nn.ModuleList()
        self.pool = nn.MaxPool2d(kernel_size=2,stride=2)
        ##down 
        for feature in self.features :
            self.down.append(DoubleConv(in_channels=int(in_channels), out_channels=int(feature)))
            in_channels = feature
        ##up 
        for feature in reversed(self.features) :
                self.up.append(nn.ConvTranspose2d(feature*2,feature,kernel_size=2,stride=2))
                self.up.append(DoubleConv(feature*2,feature))

             
        self.bottleneck = DoubleConv(self.features[-1],self.features[-1]*2,)
        self.final_layer = nn.Conv2d(self.features[0],out_channel,kernel_size=1)
    def forward(self,x):
        skip_connection = []
        
        for layer in self.down:
            x = layer(x)
            skip_connection.append(x)
            x = self.pool(x)
        x = self.bottleneck(x)
        skip_connection = skip_connection[::-1]
        for idx in range(0,len(self.up),2):
            x = self.up[idx](x)
            skip = skip_connection[idx//2]
            
            if x.shape[2:] != skip.shape[2:]:
                x = TF.interpolate(x,skip.shape[2:] ,align_corners=False,mode="bilinear")
            
            skip_connect = torch.concat((x,skip),dim=1)

            x = self.up[idx+1](skip_connect)
        return self.final_layer(x)
    
    
    
    
x = torch.randn(1,3,165,165)
model = UNET()

pred = model(x)
print(x.shape,pred.shape )


            