import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Printer,
  Download,
  Tag,
  Loader2,
  RefreshCw,
  Plus,
  FileDown,
  Trash2,
  Package,
  AlertTriangle,
  CalendarIcon,
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Import hazard symbol images
import hazardExplosive from "@assets/hazard_0_0.png";
import hazardOxidising from "@assets/hazard_0_1.png";
import hazardFlammable from "@assets/hazard_0_2.png";
import hazardCorrosive from "@assets/hazard_0_3.png";
import hazardEnvironment from "@assets/hazard_0_4.png";
import hazardHarmful from "@assets/hazard_1_0.png";
import hazardHighlyFlammable from "@assets/hazard_1_1.png";
import hazardToxic from "@assets/hazard_1_2.png";
import hazardIrritant from "@assets/hazard_1_3.png";
import hazardVeryToxic from "@assets/hazard_1_4.png";

// Define the available label formats
const labelFormats = [
  { id: 'small', name: 'Small (50x30mm)', width: 50, height: 30 },
  { id: 'medium', name: 'Medium (70x35mm)', width: 70, height: 35 },
  { id: 'large', name: 'Large (100x50mm)', width: 100, height: 50 },
];

const LabelGenerator: React.FC = () => {
  const { toast } = useToast();
  const labelRef = useRef<HTMLDivElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [productQuery, setProductQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState(labelFormats[0]);
  const [showMultiple, setShowMultiple] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [labelStyle, setLabelStyle] = useState<React.CSSProperties>({
    width: '50mm',
    height: '30mm',
    padding: '3mm',
    border: '1px dashed #ccc',
    margin: '10px',
    position: 'relative',
    backgroundColor: 'white',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [barcodeURL, setBarcodeURL] = useState<string | null>(null);

  // Fetch products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<any[]>({
    queryKey: ['/api/products'],
  });

  // Update label style when format changes
  useEffect(() => {
    setLabelStyle(prev => ({
      ...prev,
      width: `${selectedFormat.width}mm`,
      height: `${selectedFormat.height}mm`,
    }));
  }, [selectedFormat]);

  // Generate barcode when product changes
  useEffect(() => {
    if (selectedProduct) {
      generateBarcode();
    }
  }, [selectedProduct]);

  // Check for pre-selected product from Inventory page
  useEffect(() => {
    const storedProduct = localStorage.getItem('selectedProductForLabel');
    if (storedProduct) {
      try {
        const productData = JSON.parse(storedProduct);
        setSelectedProduct(productData);
        setAdvancedFormData(prev => ({
          ...prev,
          name: productData.name,
          description: productData.description || '',
          productName: productData.drugName || productData.name
        }));
        // Clear the stored data after using it
        localStorage.removeItem('selectedProductForLabel');
      } catch (error) {
        console.error('Error parsing stored product data:', error);
      }
    }
  }, []);

  // Handle product selection
  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
  };

  // Generate barcode using JsBarcode
  const generateBarcode = () => {
    if (!selectedProduct) return;

    const canvas = document.createElement('canvas');
    JsBarcode(canvas, selectedProduct.sku || selectedProduct.id.toString(), {
      format: 'CODE128',
      width: 1.5,
      height: 80,
      displayValue: true,
      fontSize: 10,
      margin: 2,
      background: '#ffffff',
    });
    
    setBarcodeURL(canvas.toDataURL('image/png'));
  };

  // Handle print button
  const handlePrint = () => {
    if (!labelRef.current || !selectedProduct) return;
    
    setIsGenerating(true);
    
    // Use html2canvas to create a canvas from the label
    html2canvas(labelRef.current).then(canvas => {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: 'Error',
          description: 'Could not open print window. Please check your popup blocker settings.',
          variant: 'destructive',
        });
        setIsGenerating(false);
        return;
      }
      
      // Add the image to the new window and trigger print
      printWindow.document.write(`
        <html>
          <head>
            <title>Label: ${selectedProduct.name}</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
              img { max-width: 100%; }
              @media print {
                body { margin: 0; padding: 0; }
                ${showMultiple && quantity > 1 ? `img { page-break-after: always; }` : ''}
              }
            </style>
          </head>
          <body>
            ${showMultiple && quantity > 1 
              ? Array(quantity).fill(0).map(() => `<img src="${canvas.toDataURL('image/png')}" />`).join('\n')
              : `<img src="${canvas.toDataURL('image/png')}" />`
            }
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
      setTimeout(() => {
        setIsGenerating(false);
        toast({
          title: 'Print prepared',
          description: `Label for ${selectedProduct.name} has been sent to printer`,
        });
      }, 1000);
    }).catch(error => {
      console.error('Printing error:', error);
      setIsGenerating(false);
      toast({
        title: 'Error',
        description: 'Failed to prepare label for printing',
        variant: 'destructive',
      });
    });
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    console.log('Download PDF clicked');
    console.log('labelRef.current:', labelRef.current);
    console.log('selectedProduct:', selectedProduct);
    
    if (!labelRef.current || !selectedProduct) {
      console.log('Missing labelRef or selectedProduct');
      return;
    }

    setIsGenerating(true);

    try {
      console.log('Starting html2canvas...');
      const canvas = await html2canvas(labelRef.current, {
        scale: 3, // Increase resolution
        useCORS: true,
        logging: false,
      });

      console.log('Canvas created:', canvas.width, 'x', canvas.height);
      const imgData = canvas.toDataURL('image/png');
      console.log('Image data created');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [selectedFormat.width + 10, selectedFormat.height + 10],
      });

      console.log('PDF instance created');
      pdf.addImage(imgData, 'PNG', 5, 5, selectedFormat.width, selectedFormat.height);
      
      if (showMultiple && quantity > 1) {
        for (let i = 1; i < quantity; i++) {
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 5, 5, selectedFormat.width, selectedFormat.height);
        }
      }

      console.log('Saving PDF...');
      pdf.save(`${selectedProduct.name}-Label.pdf`);

      toast({
        title: 'PDF generated',
        description: 'Label has been saved as PDF',
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: 'Error',
        description: `Failed to generate PDF: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // State for the enhanced label UI
  const [productName, setProductName] = useState('');
  const [formula, setFormula] = useState('');
  const [molecularWeight, setMolecularWeight] = useState('');
  const [manufacturingDate, setManufacturingDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [weight, setWeight] = useState('');
  const [selectedHazard, setSelectedHazard] = useState('');
  const [selectedSpecification, setSelectedSpecification] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [labTests, setLabTests] = useState<Array<{ type: string; value: string }>>([]);

  // Add a lab test
  const addLabTest = () => {
    setLabTests([...labTests, { type: '', value: '' }]);
  };

  // Update a lab test
  const updateLabTest = (index: number, field: 'type' | 'value', value: string) => {
    const newLabTests = [...labTests];
    newLabTests[index][field] = value;
    setLabTests(newLabTests);
  };

  // Remove a lab test
  const removeLabTest = (index: number) => {
    const newLabTests = [...labTests];
    newLabTests.splice(index, 1);
    setLabTests(newLabTests);
  };

  // Get hazard image path based on hazard type
  const getHazardImagePath = (hazardType: string) => {
    switch (hazardType) {
      case 'explosive':
        return hazardExplosive;
      case 'oxidising':
        return hazardOxidising;
      case 'flammable':
        return hazardFlammable;
      case 'corrosive':
        return hazardCorrosive;
      case 'environment':
        return hazardEnvironment;
      case 'harmful':
        return hazardHarmful;
      case 'highlyFlammable':
        return hazardHighlyFlammable;
      case 'toxic':
        return hazardToxic;
      case 'irritant':
        return hazardIrritant;
      case 'veryToxic':
        return hazardVeryToxic;
      default:
        return '';
    }
  };

  // When a product is selected in the enhanced UI
  const handleSelectProductAdvanced = (product: any) => {
    setSelectedProduct(product);
    setProductName(product.name);
    setFormula(product.formula || 'zo23');
    setMolecularWeight(product.molecularWeight || '383884.4');
    setBatchNumber(product.batchNumber || `B-${Math.floor(1000 + Math.random() * 9000)}`);
    setWeight(product.weight || '25');
    
    // Set sample lab tests if not available
    if (labTests.length === 0) {
      setLabTests([
        { type: 'identification', value: '89234092' },
        { type: 'acid_insoluble', value: '32442390239' },
        { type: 'nonvolatile_matter', value: '293489283' }
      ]);
    }
    
    // Set current date for manufacturing date if not provided
    if (!manufacturingDate) {
      setManufacturingDate(format(new Date(), 'dd/MM/yyyy'));
    } else {
      setManufacturingDate(product.manufacturingDate);
    }
    
    // Set expiry date 1 year from now if not provided
    if (!expiryDate) {
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      setExpiryDate(format(nextYear, 'yyyy-MM-dd'));
    } else {
      setExpiryDate(product.expiryDate);
    }
    
    // Set default hazard type if not selected
    if (!selectedHazard) {
      setSelectedHazard('corrosive');
    }
    
    // Set default specification if not selected
    if (!selectedSpecification) {
      setSelectedSpecification('USP');
    }
    
    generateBarcode();
  };

  // Reset the enhanced form
  const resetEnhancedForm = () => {
    setProductName('');
    setFormula('');
    setMolecularWeight('');
    setManufacturingDate('');
    setExpiryDate('');
    setBatchNumber('');
    setWeight('');
    setSelectedHazard('');
    setSelectedSpecification('');
    setSelectedSize('');
    setLabTests([]);
    setSelectedProduct(null);
    setBarcodeURL(null);
  };

  // Generate PDF for the enhanced label
  const downloadEnhancedPDF = async () => {
    if (!labelRef.current) return;

    setIsGenerating(true);

    try {
      const canvas = await html2canvas(labelRef.current, {
        scale: 3,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Calculate sizing and positioning based on selected size
      // Use full width of A4 page (210mm - minimal margins = ~200mm)
      let imgWidth = 200; // Full width with minimal margins
      let imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      switch (selectedSize) {
        case '1_per_a4': {
          // Single large label using full A4 page edge to edge
          imgWidth = 200; // Full width edge to edge (210mm - 10mm margins)
          imgHeight = 287; // Full height edge to edge (297mm - 10mm margins)
          
          // Position with minimal margins for printer compatibility
          const xPos = 5; // Minimal left margin
          const yPos = 5; // Minimal top margin
          pdf.addImage(imgData, 'PNG', xPos, yPos, imgWidth, imgHeight);
          break;
        }

        case '2_per_a4': {
          // Use full width and divide height for 2 labels
          imgWidth = 200; // Full width edge to edge
          const availableHeight = 287; // A4 height minus margins
          const labelSpacing = 5; // Minimal spacing between labels
          
          // Calculate height for 2 labels with spacing
          imgHeight = (availableHeight - labelSpacing) / 2;
          
          // Position with minimal margins
          const xOffset = 5; // Minimal left margin
          
          // Place 2 labels vertically using full width
          pdf.addImage(imgData, 'PNG', xOffset, 5, imgWidth, imgHeight);
          pdf.addImage(imgData, 'PNG', xOffset, 5 + imgHeight + labelSpacing, imgWidth, imgHeight);
          break;
        }
          
        case '3_per_a4': {
          // Use full width and divide height for 3 labels
          imgWidth = 200; // Full width edge to edge
          const availableHeight = 287; // A4 height minus margins
          const labelSpacing = 3; // Minimal spacing between labels
          
          // Calculate height for 3 labels with spacing
          imgHeight = (availableHeight - 2 * labelSpacing) / 3;
          
          // Position with minimal margins
          const xOffset = 5; // Minimal left margin
          
          // Place 3 labels vertically using full width
          pdf.addImage(imgData, 'PNG', xOffset, 5, imgWidth, imgHeight);
          pdf.addImage(imgData, 'PNG', xOffset, 5 + imgHeight + labelSpacing, imgWidth, imgHeight);
          pdf.addImage(imgData, 'PNG', xOffset, 5 + 2 * (imgHeight + labelSpacing), imgWidth, imgHeight);
          break;
        }
          
        case '6_per_a4': {
          // Use full width divided into 2 columns, full height divided into 3 rows
          const availableWidth = 200; // Full width minus margins
          const availableHeight = 287; // Full height minus margins
          const columnSpacing = 2; // Minimal gap between columns
          const rowSpacing = 2; // Minimal gap between rows
          
          // Calculate dimensions for 2x3 grid using full page
          imgWidth = (availableWidth - columnSpacing) / 2;
          imgHeight = (availableHeight - 2 * rowSpacing) / 3;
          
          // 2 columns x 3 rows = 6 labels using full page
          for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 2; col++) {
              const xPos = 5 + col * (imgWidth + columnSpacing);
              const yPos = 5 + row * (imgHeight + rowSpacing);
              pdf.addImage(imgData, 'PNG', xPos, yPos, imgWidth, imgHeight);
            }
          }
          break;
        }

        case '21_per_a4': {
          // Use full page divided into 3 columns x 7 rows = 21 labels
          const availableWidth = 200; // Full width minus margins
          const availableHeight = 287; // Full height minus margins
          const columnSpacing = 1; // Minimal gap between columns
          const rowSpacing = 1; // Minimal gap between rows
          
          // Calculate dimensions for 3x7 grid using full page
          imgWidth = (availableWidth - 2 * columnSpacing) / 3;
          imgHeight = (availableHeight - 6 * rowSpacing) / 7;
          
          // 3 columns x 7 rows = 21 labels using full page
          for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 3; col++) {
              const xPos = 5 + col * (imgWidth + columnSpacing);
              const yPos = 5 + row * (imgHeight + rowSpacing);
              pdf.addImage(imgData, 'PNG', xPos, yPos, imgWidth, imgHeight);
            }
          }
          break;
        }
          
        default:
          imgWidth = 190;
          imgHeight = (canvas.height * imgWidth) / canvas.width;
          pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
          break;
      }
      pdf.save(`${productName || 'Chemical-Label'}.pdf`);

      toast({
        title: 'PDF generated',
        description: 'Label has been saved as PDF',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">Label Generator</h1>
          <p className="text-muted-foreground">Create and print product labels with barcodes</p>
        </div>
      </div>

      <Tabs defaultValue="standard">
        <TabsList className="mb-6">
          <TabsTrigger value="standard">Standard Labels</TabsTrigger>
          <TabsTrigger value="enhanced">Chemical Labels</TabsTrigger>
        </TabsList>

        {/* Standard Label Generator */}
        <TabsContent value="standard">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Side - Products List */}
            <Card>
              <CardHeader>
                <CardTitle>Product Selection</CardTitle>
                <CardDescription>Select a product to generate a label</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="product-search">Search Products</Label>
                  <div className="relative mt-1">
                    <Input
                      id="product-search"
                      placeholder="Search by name, SKU, or category"
                      value={productQuery}
                      onChange={(e) => setProductQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="mt-4 border rounded-md h-64 overflow-y-auto">
                  {isLoadingProducts ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : products.length > 0 ? (
                    <ul className="divide-y">
                      {products.map((product) => (
                        <li
                          key={product.id}
                          className={`p-3 cursor-pointer hover:bg-muted transition-colors ${
                            selectedProduct?.id === product.id ? "bg-muted" : ""
                          }`}
                          onClick={() => handleSelectProduct(product)}
                        >
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            SKU: {product.sku || "N/A"} | Category: {product.category?.name || "N/A"}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <Tag className="h-8 w-8 mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {productQuery
                          ? "No products found. Try a different search term."
                          : "Select a product to generate a label."}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right Side - Preview & Generate */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Label Format</CardTitle>
                  <CardDescription>Customize how the label appears</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Label Size</Label>
                      <Select 
                        value={selectedFormat.id}
                        onValueChange={(value) => {
                          const format = labelFormats.find(f => f.id === value);
                          if (format) setSelectedFormat(format);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select label size" />
                        </SelectTrigger>
                        <SelectContent>
                          {labelFormats.map((format) => (
                            <SelectItem key={format.id} value={format.id}>
                              {format.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="multiple-labels"
                        checked={showMultiple}
                        onCheckedChange={setShowMultiple}
                      />
                      <Label htmlFor="multiple-labels">Multiple labels</Label>
                    </div>
                    
                    {showMultiple && (
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          min={1}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Output</CardTitle>
                  <CardDescription>Preview and generate your label</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 flex justify-center">
                    {selectedProduct ? (
                      <div 
                        ref={labelRef} 
                        style={labelStyle}
                        className="flex flex-col justify-between font-sans"
                      >
                        <div className="text-center">
                          <h3 className="font-bold" style={{ fontSize: `${selectedFormat.width * 0.07}mm` }}>
                            {selectedProduct.name}
                          </h3>
                          <p className="font-semibold" style={{ fontSize: `${selectedFormat.width * 0.05}mm` }}>
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD'
                            }).format(selectedProduct.sellingPrice)}
                          </p>
                        </div>
                        
                        <div className="flex justify-center mt-2">
                          {barcodeURL && (
                            <img
                              src={barcodeURL}
                              alt="Product Barcode"
                              style={{ maxWidth: '100%', height: 'auto' }}
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        <Tag className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>Select a product to preview label</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedProduct(null)}
                    disabled={!selectedProduct}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={handleDownloadPDF}
                      disabled={!selectedProduct || isGenerating}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      onClick={() => handlePrint()}
                      disabled={!selectedProduct || isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Printer className="mr-2 h-4 w-4" />
                          Print
                        </>
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Enhanced Label Generator (Chemical Labels) */}
        <TabsContent value="enhanced">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column - Form Inputs */}
            <Card>
              <CardHeader>
                <CardTitle>Chemical Label Details</CardTitle>
                <CardDescription>
                  Enter information for your chemical product label
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Product</Label>
                  <div className="relative">
                    <Select onValueChange={(productId) => {
                      const product = products.find(p => p.id.toString() === productId);
                      if (product) handleSelectProductAdvanced(product);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product..." />
                      </SelectTrigger>
                      <SelectContent sideOffset={5} className="max-h-[300px] overflow-y-auto z-[100]" position="popper" side="bottom" align="start">
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label>Name</Label>
                  <Input 
                    placeholder="Enter product name" 
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Formula</Label>
                  <Input 
                    placeholder="e.g. C6H12O6" 
                    value={formula}
                    onChange={(e) => setFormula(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>M.W.</Label>
                  <Input 
                    placeholder="Molecular Weight" 
                    value={molecularWeight}
                    onChange={(e) => setMolecularWeight(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Manf. Date</Label>
                  <div className="relative w-full">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {manufacturingDate ? manufacturingDate : <span className="text-muted-foreground">Select manufacturing date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={manufacturingDate ? new Date(manufacturingDate) : undefined}
                          onSelect={(date) => date && setManufacturingDate(format(date, 'dd/MM/yyyy'))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div>
                  <Label>Exp. Date</Label>
                  <div className="relative w-full">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {expiryDate ? expiryDate : <span className="text-muted-foreground">Select expiry date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={expiryDate ? new Date(expiryDate) : undefined}
                          onSelect={(date) => date && setExpiryDate(format(date, 'dd/MM/yyyy'))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div>
                  <Label>Batch No.</Label>
                  <Input 
                    placeholder="Batch Number" 
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Weight</Label>
                  <Input 
                    placeholder="Weight in kg" 
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Lab Tests</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={addLabTest}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Lab Test
                    </Button>
                  </div>
                  
                  {labTests.map((test, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 items-center">
                      <div className="col-span-2">
                        <Select 
                          value={test.type} 
                          onValueChange={(value) => updateLabTest(index, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Lab Test Type" />
                          </SelectTrigger>
                          <SelectContent sideOffset={5} className="max-h-[300px] overflow-y-auto" position="popper" side="bottom" align="start">
                            <SelectItem value="assay">Assay</SelectItem>
                            <SelectItem value="ph">pH</SelectItem>
                            <SelectItem value="melting_point">Melting point</SelectItem>
                            <SelectItem value="identification">Identification</SelectItem>
                            <SelectItem value="loss_on_drying">Loss on drying</SelectItem>
                            <SelectItem value="loss_on_ignition">Loss on ignition</SelectItem>
                            <SelectItem value="water_insoluble">Water insoluble matter</SelectItem>
                            <SelectItem value="acid_insoluble">Acid insoluble matter</SelectItem>
                            <SelectItem value="nonvolatile_matter">Nonvolatile matter</SelectItem>
                            <SelectItem value="test_sulphate">Test for sulphate (SO4)</SelectItem>
                            <SelectItem value="test_chlorine">Test for chlorine (Cl)</SelectItem>
                            <SelectItem value="test_phosphate">Test for phosphate (PO4)</SelectItem>
                            <SelectItem value="test_iron">Test for iron (Fe)</SelectItem>
                            <SelectItem value="test_fluoride">Test for fluoride (F)</SelectItem>
                            <SelectItem value="test_arsenic">Test for Arsenic (As)</SelectItem>
                            <SelectItem value="test_lead">Test for lead (Pb)</SelectItem>
                            <SelectItem value="test_mercury">Test for mercury (Hg)</SelectItem>
                            <SelectItem value="test_barium">Test for barium (Ba)</SelectItem>
                            <SelectItem value="heavy_metals">Test for heavy metals</SelectItem>
                            <SelectItem value="moisture_content">Moisture content</SelectItem>
                            <SelectItem value="dissolution">Dissolution</SelectItem>
                            <SelectItem value="impurity">Impurity</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Input 
                          value={test.value} 
                          onChange={(e) => updateLabTest(index, 'value', e.target.value)}
                          placeholder="Value"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLabTest(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>


              </CardContent>
            </Card>
            
            {/* Right Column - Preview & Settings */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Label Preview</CardTitle>
                  <CardDescription>Preview how the label will look when printed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 mb-6 min-h-[300px] flex justify-center">
                    {productName ? (
                      <div 
                        ref={labelRef} 
                        className="bg-white border border-gray-300 shadow-sm"
                        style={{ 
                          width: "100%", 
                          maxWidth: "210mm", 
                          minHeight: `${100 + Math.max(0, (labTests.length - 3) * 10)}mm`
                        }}
                      >
                        {/* Label Header */}
                        <div className="bg-blue-600 text-white p-1.5 relative">
                          <div className="absolute top-0 left-0" style={{ zIndex: 5 }}>
                            <img 
                              src="/logo.png"
                              alt="Morgan Chemicals Logo" 
                              className="w-16 h-16 object-cover"
                              style={{ objectPosition: 'left top' }}
                            />
                          </div>
                          <div className="text-lg font-bold text-center w-full px-3">
                            MORGAN CHEMICALS IND. CO. 
                          </div>
                        </div>
                        
                        {/* Product Name */}
                        <div className="text-base font-bold p-1.5 text-center">
                          {productName}
                        </div>
                        
                        {/* Main Content */}
                        <div className="flex relative">
                          {/* Left Side - Specifications */}
                          <div className="w-1/2 p-3">
                            <table className="w-full text-xs">
                              <tbody>
                                {formula && (
                                  <tr>
                                    <td className="font-semibold pr-2 pb-1 align-top">Formula:</td>
                                    <td className="pb-1">{formula}</td>
                                  </tr>
                                )}
                                
                                {molecularWeight && (
                                  <tr>
                                    <td className="font-semibold pr-2 pb-1 align-top">M.W:</td>
                                    <td className="pb-1">{molecularWeight}</td>
                                  </tr>
                                )}
                                
                                {labTests.map((test, index) => (
                                  <tr key={index}>
                                    <td className="font-semibold pr-2 pb-1 align-top">{test.type}:</td>
                                    <td className="pb-1">{test.value}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            
                            {selectedSpecification && (
                              <div className="mt-1 text-[10px] font-semibold">
                                Complies with {selectedSpecification} specifications
                              </div>
                            )}
                          </div>
                          
                          {/* Right Side - Dates */}
                          <div className="w-1/2 p-3">
                            <div className="space-y-2 mb-2" style={{ width: '65%', marginLeft: '0', marginRight: 'auto' }}>
                              {manufacturingDate && (
                                <div className="text-right">
                                  <div className="font-semibold text-xs">Manf. Date</div>
                                  <div className="text-xs">{manufacturingDate}</div>
                                </div>
                              )}
                              
                              {expiryDate && (
                                <div className="text-right">
                                  <div className="font-semibold text-xs">Exp. Date</div>
                                  <div className="text-xs">{expiryDate}</div>
                                </div>
                              )}
                              
                              {batchNumber && (
                                <div className="text-right">
                                  <div className="font-semibold text-xs">Batch No</div>
                                  <div className="text-xs">{batchNumber}</div>
                                </div>
                              )}
                              
                              {weight && (
                                <div className="font-bold mt-1 text-right">
                                  {weight} Kg
                                </div>
                              )}
                            </div>
                            
                            {/* Vertical Barcode */}
                            <div className="absolute top-0 right-0 h-full" style={{ width: '40px', overflow: 'hidden', zIndex: 10 }}>
                              <div style={{ 
                                position: 'absolute',
                                top: '40%',
                                right: '-80px',
                                transform: 'translateY(-50%) rotate(90deg)',
                                width: '170px',
                                height: '40px',
                                backgroundColor: 'white'
                              }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <div style={{ 
                                    display: 'flex', 
                                    height: '30px', 
                                    width: '100%',
                                    justifyContent: 'center'
                                  }}>
                                    {Array(25).fill(0).map((_, i) => (
                                      <div 
                                        key={i} 
                                        style={{ 
                                          width: `${(i % 3 === 0) ? 4 : 3}px`, 
                                          height: '100%',
                                          backgroundColor: 'black',
                                          marginRight: '2px'
                                        }}
                                      />
                                    ))}
                                  </div>
                                  <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '2px' }}>
                                    {batchNumber || '123456789'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Hazard symbol in the center */}
                          {selectedHazard && (
                            <div className="absolute left-[58%] transform -translate-x-1/2 top-1/3 -translate-y-1/2">
                              <img 
                                src={getHazardImagePath(selectedHazard)} 
                                alt="Hazard symbol" 
                                className="w-20 object-contain" 
                                style={{ imageRendering: 'crisp-edges' }}
                              />
                            </div>
                          )}
                        </div>
                        
                        {/* Footer */}
                        <div className="bg-blue-600 text-white text-[8px] leading-tight p-1.5 relative -mt-0.5">
                          {/* QR Code aligned perfectly with the blue rectangle corner */}
                          <div className="absolute top-0 left-0 h-full">
                            <img 
                              src="/qrcode.png"
                              alt="QR Code" 
                              className="h-full object-contain"
                            />
                          </div>
                          <div className="ml-[calc(100%/5)] -mt-1.5">
                            <p className="font-semibold text-left">إنتاج شركة مرجان للصناعات الكيماوية &#x0028;العاشر من رمضان&#x0029; صنع في مصر</p>
                            <p className="font-semibold">Head Office & Factory: 3rd Industrial Zone A1, Taba Street, Tenth of Ramadan City</p>
                            <p>Tel: 055/4410890 - 055/4410891 - 055/4410255 | Mobile: 01223991290</p>
                            <p>Fax: 055/4410115 | Email: morgan_chem.ind@hotmail.com</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <Package className="h-12 w-12 mb-2 opacity-30" />
                        <p className="text-muted-foreground">Fill out the form to preview the label</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Settings */}
                  <div className="pt-3">
                    <h3 className="text-base font-medium mb-4">Label Settings</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="hazard-type">Hazardous Type</Label>
                        <Select 
                          value={selectedHazard}
                          onValueChange={setSelectedHazard}
                        >
                          <SelectTrigger id="hazard-type" className="w-full">
                            <SelectValue placeholder="Select hazard type" />
                          </SelectTrigger>
                          <SelectContent sideOffset={5} className="max-h-[300px] overflow-y-auto z-[100]" position="popper" side="bottom" align="start">
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="explosive">Explosive</SelectItem>
                            <SelectItem value="oxidising">Oxidising</SelectItem>
                            <SelectItem value="flammable">Extremely Flammable</SelectItem>
                            <SelectItem value="corrosive">Corrosive</SelectItem>
                            <SelectItem value="environment">Dangerous for Environment</SelectItem>
                            <SelectItem value="harmful">Harmful</SelectItem>
                            <SelectItem value="highlyFlammable">Highly Flammable</SelectItem>
                            <SelectItem value="toxic">Toxic</SelectItem>
                            <SelectItem value="irritant">Irritant</SelectItem>
                            <SelectItem value="veryToxic">Very Toxic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label htmlFor="chem-spec">Chemical Specifications</Label>
                        <Select 
                          value={selectedSpecification}
                          onValueChange={setSelectedSpecification}
                        >
                          <SelectTrigger id="chem-spec" className="w-full">
                            <SelectValue placeholder="Select specification" />
                          </SelectTrigger>
                          <SelectContent sideOffset={5} className="max-h-[300px] overflow-y-auto z-[100]" position="popper" side="bottom" align="start">
                            <SelectItem value="FCC">FCC</SelectItem>
                            <SelectItem value="USP">USP</SelectItem>
                            <SelectItem value="BP">BP</SelectItem>
                            <SelectItem value="EXTRA PURE">EXTRA PURE</SelectItem>
                            <SelectItem value="TECHNICAL GRADE">TECHNICAL GRADE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 mb-4">
                      <Label htmlFor="label-size">Size on A4</Label>
                      <Select 
                        value={selectedSize}
                        onValueChange={setSelectedSize}
                      >
                        <SelectTrigger id="label-size" className="w-full">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent sideOffset={5} className="max-h-[300px] overflow-y-auto z-[100]" position="popper" side="bottom" align="start">
                          <SelectItem value="1_per_a4">1 PER A4</SelectItem>
                          <SelectItem value="2_per_a4">2 PER A4</SelectItem>
                          <SelectItem value="3_per_a4">3 PER A4</SelectItem>
                          <SelectItem value="6_per_a4">6 PER A4</SelectItem>
                          <SelectItem value="21_per_a4">21 PER A4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetEnhancedForm}
                    disabled={isGenerating}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={downloadEnhancedPDF}
                      disabled={isGenerating || !productName}
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handlePrint()}
                      disabled={isGenerating || !productName}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Print
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LabelGenerator;